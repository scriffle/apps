/* VCE Physics 3&4 layered textbook — shared behaviour. No dependencies. */
(function () {
  'use strict';

  var PAGE = location.pathname;

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
