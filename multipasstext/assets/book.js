/* VCE Physics 3&4 layered textbook — shared behaviour. No dependencies. */
(function () {
  'use strict';

  var PAGE = location.pathname;
  var SCRIPT = document.querySelector('script[src*="book.js"]');
  function assetURL(name) { return SCRIPT ? new URL(name, SCRIPT.src).href : name; }

  /* --- topbar quick-nav: brand = full contents, crumb = this pass's topics (assets/nav.json) --- */
  function buildNav(data) {
    var bookRoot = new URL('../', SCRIPT ? SCRIPT.src : location.href);
    function abs(href) { return new URL(href, bookRoot).href; }
    function isHere(href) { return new URL(href, bookRoot).pathname === location.pathname; }
    var passId = (PAGE.match(/\/(pass[123])\//) || [])[1];

    // brand → jump anywhere (full contents, grouped by pass)
    var brand = document.querySelector('header.topbar .brand');
    if (brand) {
      var b = document.createElement('select');
      b.className = 'nav-select brand-select';
      b.setAttribute('aria-label', 'Jump to a section of the book');
      var head = document.createElement('option');
      head.value = ''; head.textContent = data.brandLabel || 'Contents'; head.selected = true;
      b.appendChild(head);
      if (data.index) {
        var io = document.createElement('option');
        io.value = abs(data.index.href); io.textContent = data.index.label;
        b.appendChild(io);
      }
      (data.passes || []).forEach(function (p) {
        var og = document.createElement('optgroup'); og.label = p.label;
        (p.pages || []).forEach(function (pg) {
          var o = document.createElement('option');
          o.value = abs(pg.href);
          o.textContent = (isHere(pg.href) ? '› ' : '') + pg.label;
          og.appendChild(o);
        });
        b.appendChild(og);
      });
      b.addEventListener('change', function () { if (b.value) location.href = b.value; });
      brand.parentNode.replaceChild(b, brand);
    }

    // crumb → another topic in this pass (contents differ per pass)
    var crumb = document.querySelector('header.topbar .crumb');
    var pass = (data.passes || []).filter(function (p) { return p.id === passId; })[0];
    if (crumb && pass) {
      var c = document.createElement('select');
      c.className = 'nav-select crumb-select';
      c.setAttribute('aria-label', 'Jump to another topic in this pass');
      pass.pages.forEach(function (pg) {
        var o = document.createElement('option');
        o.value = abs(pg.href);
        o.textContent = pg.crumb || pg.label;
        if (isHere(pg.href)) o.selected = true;
        c.appendChild(o);
      });
      c.addEventListener('change', function () { if (c.value) location.href = c.value; });
      crumb.parentNode.replaceChild(c, crumb);
    }
  }

  (function () {
    if (!/\/pass[123]\//.test(PAGE)) return;             // brand + crumb dropdowns on Pass 1–3
    if (!document.querySelector('header.topbar')) return;
    fetch(assetURL('nav.json'))
      .then(function (r) { return r.json(); })
      .then(buildNav)
      .catch(function (e) { if (window.console) console.warn('quick-nav: could not load nav.json —', e); });
  })();

  /* --- voice switcher (Pass 1 & 2 only): menu built from assets/voices.json --- */
  function buildVoiceSwitch(data, locked) {
    var wrap = document.createElement('div');
    wrap.className = 'voice-switch' + (locked ? ' is-locked' : '');

    var label = document.createElement('label');
    label.className = 'vs-label';
    label.setAttribute('for', 'voiceSelect');
    label.textContent = 'Voice';

    var sel = document.createElement('select');
    sel.id = 'voiceSelect';
    sel.className = 'voice-select';
    sel.setAttribute('aria-label', 'Reading voice');
    if (locked) {                                        // Pass 3 is VCAA-only — shown but unselectable
      sel.disabled = true;
      sel.title = 'Pass 3 is written in the VCAA exam voice';
    }

    function addOption(parent, v) {
      var o = document.createElement('option');
      o.value = v.id;
      o.textContent = v.label;
      if (v.available !== true) o.disabled = true;       // greyed until its content is authored
      if (v.id === data.defaultId) o.selected = true;
      parent.appendChild(o);
    }

    (data.options || []).forEach(function (v) { addOption(sel, v); });
    (data.groups || []).forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.label;
      (g.voices || []).forEach(function (v) { addOption(og, v); });
      sel.appendChild(og);
    });

    wrap.appendChild(label);
    wrap.appendChild(sel);
    return wrap;
  }

  /* swap the narration of [data-vc] chunks to the selected voice; VCAA = the in-page baseline */
  function setupVoiceSwap(sel, defaultId) {
    var PAGEKEY = (PAGE.match(/\/pass[12]\/([^\/.]+)\.html/) || [])[1];
    if (!PAGEKEY) return;
    var nodes = [].slice.call(document.querySelectorAll('[data-vc]'));
    var baseline = {};                                   // data-vc -> the page's VCAA innerHTML
    nodes.forEach(function (n) { baseline[n.getAttribute('data-vc')] = n.innerHTML; });
    var KEY = 'vcephys:voice';
    var store = null;                                    // voices/<page>.json, fetched once

    function apply(id) {
      var v = (id && id !== defaultId && store && store[id]) ? store[id] : null;
      nodes.forEach(function (n) {
        var k = n.getAttribute('data-vc');
        n.innerHTML = (v && v[k] != null) ? v[k] : baseline[k];
      });
    }
    function select(id) {
      try { localStorage.setItem(KEY, id); } catch (e) {}
      if (!id || id === defaultId || (store && !store[id])) { apply(defaultId); return; }
      if (store) { apply(id); return; }
      fetch(assetURL('voices/' + PAGEKEY + '.json'))
        .then(function (r) { return r.json(); })
        .then(function (d) { store = d; apply(id); })
        .catch(function (e) { if (window.console) console.warn('voice content load failed —', e); });
    }
    sel.addEventListener('change', function () { select(sel.value); });

    var saved = null;                                    // restore the reader's last voice
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && saved !== defaultId) {
      var opt = sel.querySelector('option[value="' + saved + '"]');
      if (opt && !opt.disabled) { sel.value = saved; select(saved); }
    }
  }

  (function () {
    if (!/\/pass[123]\//.test(PAGE)) return;             // Pass 1–3 (not the root pages)
    var bar = document.querySelector('header.topbar');
    if (!bar) return;
    var locked = /\/pass3\//.test(PAGE);                 // Pass 3: shown but locked, so the topbar never reflows
    fetch(assetURL('voices.json'))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var wrap = buildVoiceSwitch(data, locked);
        bar.appendChild(wrap);
        if (!locked) setupVoiceSwap(wrap.querySelector('select'), data.defaultId);
      })
      .catch(function (e) {
        if (window.console) console.warn('voice switcher: could not load voices.json —', e);
      });
  })();

  /* --- expand / collapse all chevron sections --- */
  function setAll(open) {
    document.querySelectorAll('details.sec').forEach(function (d) { d.open = open; });
    save();
  }
  document.querySelectorAll('.sec-controls [data-act="expand"]').forEach(function (b) {
    b.addEventListener('click', function () { setAll(true); });
  });
  document.querySelectorAll('.sec-controls [data-act="collapse"]').forEach(function (b) {
    b.addEventListener('click', function () { setAll(false); });
  });

  /* --- remember which sections are open on this page --- */
  function save() {
    try {
      var open = [];
      document.querySelectorAll('details.sec[id]').forEach(function (d) {
        if (d.open) open.push(d.id);
      });
      localStorage.setItem('vcephys:' + PAGE, JSON.stringify(open));
    } catch (e) { /* storage unavailable — fine */ }
  }
  function restore() {
    try {
      var raw = localStorage.getItem('vcephys:' + PAGE);
      if (!raw) return;
      JSON.parse(raw).forEach(function (id) {
        var d = document.getElementById(id);
        if (d && d.tagName === 'DETAILS') d.open = true;
      });
    } catch (e) { /* ignore */ }
  }
  restore();
  document.querySelectorAll('details.sec').forEach(function (d) {
    d.addEventListener('toggle', save);
  });

  /* --- deep links: opening #some-section inside a closed details --- */
  function openTarget() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    var d = el.closest ? el.closest('details') : null;
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView();
  }
  openTarget();
  window.addEventListener('hashchange', openTarget);

  /* --- print: open everything so nothing is hidden on paper --- */
  var printState = null;
  window.addEventListener('beforeprint', function () {
    printState = [];
    document.querySelectorAll('details').forEach(function (d) {
      printState.push(d.open);
      d.open = true;
    });
  });
  window.addEventListener('afterprint', function () {
    if (!printState) return;
    document.querySelectorAll('details').forEach(function (d, i) {
      if (i < printState.length) d.open = printState[i];
    });
    printState = null;
  });
})();
