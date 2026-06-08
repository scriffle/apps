#!/usr/bin/env python3
"""
build_manifest.py — precompute the entire Bach-chorale catalogue into one
immutable, beat-based manifest for the distributed voice player.

Why precompute:
  - Every device must know the cumulative duration of every chorale to locate
    "where am I now?" on the shared timeline. That needs the whole catalogue up
    front anyway.
  - A single frozen artifact = single source of truth. The maths that finds your
    *position* and the data that makes the *sound* read from the same numbers, so
    they can never drift apart. No kern parsing happens at runtime.

Key design choice: everything is stored in BEATS (quarter-note units), never
seconds. Tempo (seconds-per-beat) is a pure runtime multiplier, so it can be
retuned forever without rebuilding this file. Fermata holds and phrase breaths
are folded into the beat numbers so there is zero runtime interpretation.

Output:
  manifest.json  — musical data, in beats (large, immutable, cache hard)
  config.json    — epoch + secondsPerBeat (tiny, hand-editable, the "performance")
"""

import json, os, re, sys, glob, html, hashlib

# ---- the "performance" constants (musical feel; tempo lives in config.json) ----
HOLD_EXTRA_BEATS   = 2.0    # extra beats the phrase-final (fermata) chord is held
BREATH_BEATS       = 1.0    # silent breath inserted after each fermata (phrase end)
CHORALE_GAP_BEATS  = 2.0    # silence between consecutive chorales
SECONDS_PER_BEAT   = 4.0    # default tempo: a crotchet (quarter) = 4 seconds
EPOCH_MS           = 1735689600000  # 2025-01-01T00:00:00Z — shared downbeat reference
MANIFEST_VERSION   = 1

HERE = os.path.dirname(os.path.abspath(__file__))
KERN_DIR = os.path.join(HERE, "kern")
TITLES_PATH = os.path.join(HERE, "titles.json")   # German title -> {en, zh}; see gen_titles.py

try:
    with open(TITLES_PATH, encoding="utf-8") as _tf:
        TRANSLATIONS = json.load(_tf)
except FileNotFoundError:
    TRANSLATIONS = {}

PITCH_MAP = {'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71}

warnings = []


def parse_kern_token(token):
    """Parse one **kern data token. Returns a dict or None if not a note/rest.
    dict keys: midi (None for rest), dur (quarter-beats), is_rest,
               tie_start, tie_end, grace, fermata
    """
    fermata = ';' in token
    grace   = ('q' in token) or ('Q' in token)
    tie_start = '[' in token
    tie_end   = (']' in token) or ('_' in token)

    # duration: leading integer + optional dots (e.g. "4", "2.", "16")
    m = re.match(r'^(\d+)(\.*)', token)
    dur = None
    if m:
        n = int(m.group(1))
        dots = len(m.group(2))
        base = 8.0 if n == 0 else 4.0 / n   # 0 = breve (8 quarter-beats)
        total, add = base, base
        for _ in range(dots):
            add /= 2.0
            total += add
        dur = total

    if 'r' in token:                         # rest
        return {'midi': None, 'dur': dur if dur else 1.0, 'is_rest': True,
                'tie_start': False, 'tie_end': False, 'grace': grace, 'fermata': fermata}

    pm = re.search(r'([A-Ga-g]+)', token)
    if not pm:
        return None                           # e.g. a lone barline-ish artifact

    pitch_str = pm.group(1)
    base_pitch = pitch_str[0].upper()
    is_lower = pitch_str[0].islower()
    octave_count = len(pitch_str)

    midi = PITCH_MAP[base_pitch]
    if is_lower:                              # c = C4(60), cc = C5 ...
        midi += (octave_count - 1) * 12
    else:                                     # C = C3(48), CC = C2 ...
        midi -= 12
        midi -= (octave_count - 1) * 12

    midi += token.count('#') - token.count('-')   # accidentals (- = flat)

    if grace:
        dur = 0.0
    return {'midi': midi, 'dur': dur if dur is not None else 1.0, 'is_rest': False,
            'tie_start': tie_start, 'tie_end': tie_end, 'grace': grace, 'fermata': fermata}


def parse_chorale(path):
    """Parse one .krn file → (meta, voices) where voices is 4 lists (S,A,T,B) of
    [startBeat, durBeat, midi], plus chorale lengthBeats. Returns None on failure.
    Straight-through reading (written repeats are not expanded — a deliberate v1
    simplification; each chorale plays once, top to bottom)."""
    fname = os.path.basename(path)
    with open(path, encoding='utf-8', errors='replace') as f:
        lines = f.read().split('\n')

    meta = {'num': int(re.search(r'(\d+)', fname).group(1)),
            'file': fname, 'title': None, 'key': None, 'bwv': None}
    spines = None
    rows = []   # each: list of `spines` raw token strings

    for raw in lines:
        line = raw.rstrip('\r')
        if line == '':
            continue
        if line.startswith('!'):
            # reference records (metadata)
            mt = re.match(r'!!!OTL@EN:\s*(.+)', line)
            if mt and not meta['title']: meta['title'] = mt.group(1).strip()
            mt = re.match(r'!!!OTL@@DE:\s*(.+)', line)
            if mt and not meta['title']: meta['title'] = mt.group(1).strip()
            mt = re.match(r'!!!OTL:\s*(.+)', line)
            if mt and not meta['title']: meta['title'] = mt.group(1).strip()
            mt = re.match(r'!!!SCT:\s*(.+)', line)
            if mt: meta['bwv'] = mt.group(1).strip()
            continue
        if line.startswith('*'):
            if '**kern' in line:
                spines = line.split('\t').count('**kern')
            if re.match(r'^\*[A-Ga-g][#-]?:\s*$', line.split('\t')[0]):
                meta['key'] = line.split('\t')[0][1:].rstrip(':')
            if '*^' in line or '*v' in line:
                warnings.append(f"{fname}: spine split/join encountered (best-effort parse)")
            continue
        if line.startswith('='):              # barline
            continue
        tokens = line.split('\t')
        if spines is None:
            spines = 4
        if len(tokens) < spines:
            continue                          # malformed; skip
        rows.append([t.strip() for t in tokens[:spines]])

    if spines != 4:
        warnings.append(f"{fname}: expected 4 spines, found {spines} — skipped")
        return None
    if not rows:
        warnings.append(f"{fname}: no data rows — skipped")
        return None

    # --- proper polyphonic timeline ---------------------------------------
    # The naive "advance by the shortest new onset" model misplaces notes when
    # voices aren't rhythmically aligned (a held note in one voice spanning two
    # quicker notes in another). Instead track, per voice, the beat at which its
    # current note ENDS (voice_end). The next event line falls at the SOONEST
    # voice_end > now; each note sounds from its onset to its next onset/rest.
    # (columns are Bass,Tenor,Alto,Soprano left→right)
    beat = 0.0
    voice_end = [0.0] * spines
    cur = [None] * spines               # open note per voice: {start,midi,fermata}
    notes = [[] for _ in range(spines)]

    def close(j, end):
        if cur[j] is not None:
            cur[j]['dur'] = end - cur[j]['start']
            notes[j].append(cur[j]); cur[j] = None

    for row in rows:
        for j in range(spines):
            tok = row[j]
            p = None if tok == '.' else parse_kern_token(tok)
            if p is None or p['grace']:
                continue                    # '.' hold, unparseable, or ornament → sustain
            if p['is_rest']:
                close(j, beat)
                voice_end[j] = beat + p['dur']   # silence occupies time
                continue
            if p['tie_end'] and not p['tie_start'] and cur[j] is not None:
                voice_end[j] = beat + p['dur']   # tie continuation → extend, no re-attack
                continue
            close(j, beat)
            cur[j] = {'start': beat, 'midi': p['midi'], 'fermata': p['fermata']}
            voice_end[j] = beat + p['dur']
        nxt = [ve for ve in voice_end if ve > beat + 1e-9]
        if not nxt:
            break
        beat = min(nxt)
    for j in range(spines):
        close(j, voice_end[j])              # final note runs to its written end

    # --- fermatas: hold the phrase-final chord, then breathe ---------------
    # Group fermata-marked notes that overlap (one sustained cadence chord); the
    # phrase ends at the LATEST release in the group. At each phrase end E we add
    # HOLD_EXTRA to every note ending at E (the whole sonority holds together) and
    # shift everything starting at/after E by HOLD_EXTRA+BREATH. Baking this in
    # beats keeps every device identical.
    ferm = sorted((n['start'], n['start'] + n['dur'])
                  for j in range(spines) for n in notes[j] if n.get('fermata'))
    phrase_ends = []
    if ferm:
        cs, ce = ferm[0]
        for s, e in ferm[1:]:
            if s < ce - 1e-9:
                ce = max(ce, e)
            else:
                phrase_ends.append(ce); cs, ce = s, e
        phrase_ends.append(ce)
    phrase_ends = sorted({round(e, 6) for e in phrase_ends})

    F = HOLD_EXTRA_BEATS + BREATH_BEATS
    def shift_for(s):
        return F * sum(1 for E in phrase_ends if E <= s + 1e-6)
    def ends_at_cadence(e):
        return any(abs(E - e) < 1e-6 for E in phrase_ends)

    voice_notes = [[] for _ in range(spines)]
    length = 0.0
    for j in range(spines):
        for n in notes[j]:
            s, d = n['start'], n['dur']
            ns = s + shift_for(s)
            nd = d + (HOLD_EXTRA_BEATS if ends_at_cadence(round(s + d, 6)) else 0.0)
            voice_notes[j].append([round(ns, 5), round(nd, 5), n['midi']])
            length = max(length, ns + nd)

    # Humdrum stores non-ASCII (German umlauts, ß) as SGML entities — &uuml; &ouml;
    # &auml; &szlig; — so the title reads ASCII on disk. Decode to real Unicode here
    # (manifest is UTF-8 / JSON-escaped) so the player shows "Schmücke", not
    # "Schm&uuml;cke". html.unescape covers all named + numeric entities.
    if meta['title']:
        meta['title'] = html.unescape(meta['title'])

    # reverse to Soprano,Alto,Tenor,Bass
    voices_satb = [voice_notes[3], voice_notes[2], voice_notes[1], voice_notes[0]]
    return meta, voices_satb, round(length, 5)


def main():
    paths = sorted(glob.glob(os.path.join(KERN_DIR, "chor*.krn")),
                   key=lambda p: int(re.search(r'(\d+)', os.path.basename(p)).group(1)))
    if not paths:
        print("No kern files found in", KERN_DIR); sys.exit(1)

    chorales = []
    global_beat = 0.0
    for p in paths:
        res = parse_chorale(p)
        if not res:
            continue
        meta, voices, length = res
        title = meta['title'] or meta['file']
        tr = TRANSLATIONS.get(title)
        if tr is None:
            warnings.append(f"{meta['file']}: no EN/ZH translation for title {title!r}")
            tr = {}
        chorales.append({
            'num': meta['num'], 'title': title,
            'titleEn': tr.get('en'), 'titleZh': tr.get('zh'),
            'key': meta['key'], 'bwv': meta['bwv'],
            'startBeat': round(global_beat, 5), 'lengthBeats': length,
            'voices': voices,
        })
        global_beat += length + CHORALE_GAP_BEATS

    manifest = {
        'version': MANIFEST_VERSION,
        'voiceNames': ['Soprano', 'Alto', 'Tenor', 'Bass'],
        'fermata': {'holdExtraBeats': HOLD_EXTRA_BEATS, 'breathBeats': BREATH_BEATS},
        'choraleGapBeats': CHORALE_GAP_BEATS,
        'totalBeats': round(global_beat, 5),
        'chorales': chorales,
    }
    # Serialize the manifest once and hash it: the hash is a content fingerprint the
    # player appends as ?v=<hash> so a changed manifest is re-fetched fresh while an
    # unchanged one stays hard-cached (immutable per content version).
    manifest_str = json.dumps(manifest, separators=(',', ':'))
    manifest_hash = hashlib.md5(manifest_str.encode('utf-8')).hexdigest()[:12]

    config_path = os.path.join(HERE, 'config.json')
    config = {
        'version': MANIFEST_VERSION,
        'epoch': EPOCH_MS,
        'secondsPerBeat': SECONDS_PER_BEAT,
        'master': {'volume': 1.0},
    }
    # Preserve hand-edited performance settings (tempo, epoch, volume) across rebuilds —
    # config.json is the editable "performance" file; only version + hash are refreshed.
    try:
        with open(config_path, encoding='utf-8') as f:
            existing = json.load(f)
        for k in ('epoch', 'secondsPerBeat', 'master'):
            if k in existing:
                config[k] = existing[k]
    except (FileNotFoundError, ValueError):
        pass
    config['manifestHash'] = manifest_hash

    with open(os.path.join(HERE, 'manifest.json'), 'w') as f:
        f.write(manifest_str)
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    # ---- validation report ----
    total_notes = sum(len(v) for ch in chorales for v in ch['voices'])
    size_mb = os.path.getsize(os.path.join(HERE, 'manifest.json')) / 1e6
    cycle_hours = manifest['totalBeats'] * SECONDS_PER_BEAT / 3600
    print(f"chorales parsed : {len(chorales)} / {len(paths)}")
    print(f"total notes     : {total_notes:,}")
    print(f"total beats      : {manifest['totalBeats']:,.1f}")
    print(f"full cycle @ {SECONDS_PER_BEAT:g}s/beat : {cycle_hours:.1f} hours")
    print(f"manifest size    : {size_mb:.2f} MB")
    if warnings:
        print(f"\nwarnings ({len(warnings)}):")
        for w in warnings[:30]:
            print("  -", w)
        if len(warnings) > 30:
            print(f"  ... +{len(warnings)-30} more")
    # spot-check chorale 1
    c1 = next(c for c in chorales if c['num'] == 1)
    print(f"\nchor001 '{c1['title']}' key={c1['key']} bwv={c1['bwv']}")
    print(f"  lengthBeats={c1['lengthBeats']} startBeat={c1['startBeat']}")
    for name, v in zip(manifest['voiceNames'], c1['voices']):
        first = v[0] if v else None
        print(f"  {name:8s}: {len(v):3d} notes, first={first}")


if __name__ == '__main__':
    main()
