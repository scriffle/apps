// =============================================================================
// HarmonyModel — the single source of truth.
//
// Given any set of pitches this module returns, and ONLY returns:
//   1. roughness          — sensory dissonance (Plomp-Levelt / Sethares curve,
//                           applied pairwise across 6 sawtooth-weighted harmonics)
//   2. voiceLeading       — minimal total semitone displacement between two chords
//                           under optimal voice assignment (Tymoczko-style)
//   3. intervalClassVector— the IC vector of a sonority
//
// Geometry, colour, and audio downstream are required to consume ONLY these.
// Nothing in this file renders anything; it is pure and runs in Node and the
// browser unchanged.
//
// AUTHENTICITY NOTE ON REGISTER & TRANSPOSITION INVARIANCE
// --------------------------------------------------------
// Plomp-Levelt is genuinely register-dependent: a semitone low in the bass is
// rougher than a semitone in the treble, because the critical band is wider (in
// semitones) at low frequencies. We compute roughness on the ACTUAL sounding
// frequencies so that the number the geometry uses is exactly the spectrum the
// audio plays — no anchoring fudge. A consequence is that transposing the whole
// scene is only *approximately* fit-invariant, not exactly. Over the central
// register and for the small shifts the UI allows, the relative dissonance of
// intervals is near-constant (Sethares), so the invariance acceptance test holds
// to a tight tolerance rather than to the bit. We treat that residual as honest
// physics, not a bug, and the "How this works" panel says so.
// =============================================================================

// ---------------------------------------------------------------------------
// Pitch / frequency utilities
// ---------------------------------------------------------------------------

export const A4_HZ = 440;
export const A4_MIDI = 69;

/** MIDI note number -> frequency in Hz (equal temperament). */
export function midiToFreq(midi) {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Pitch class (0..11) of a MIDI note. C = 0. */
export function pc(midi) {
  return ((midi % 12) + 12) % 12;
}

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const PC_NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** "C", "F#", "Bb", "Eb" ... -> pitch class 0..11 */
export function noteNameToPc(name) {
  const m = /^([A-Ga-g])(#{1,2}|b{1,2}|x)?$/.exec(name.trim());
  if (!m) throw new Error(`Bad note name: "${name}"`);
  let p = LETTER_PC[m[1].toUpperCase()];
  const acc = m[2] || '';
  if (acc === 'x') p += 2;
  else for (const ch of acc) p += ch === '#' ? 1 : -1;
  return ((p % 12) + 12) % 12;
}

export function pcToName(p) {
  return PC_NAME[((p % 12) + 12) % 12];
}

// ---------------------------------------------------------------------------
// 1. ROUGHNESS — Plomp-Levelt sensory dissonance via Sethares' parametric model
// ---------------------------------------------------------------------------
//
// Sethares' dissmeasure for a PAIR of pure tones (partials). Constants are the
// published fit to the Plomp & Levelt (1965) data:
//   d(f1,f2) = a_min * ( C1*exp(A1*S*df) + C2*exp(A2*S*df) )
//   S        = Dstar / (S1*fmin + S2)
// The curve is 0 at df=0 (coincident partials -> unison/octave consonance falls
// out for free), rises to a maximum near a quarter of the critical band, then
// decays. We never special-case any interval; every consonance and dissonance
// in the app is an emergent sum of this one function.

const PL = {
  Dstar: 0.24,
  S1: 0.0207,
  S2: 18.96,
  C1: 5,
  C2: -5,
  A1: -3.51,
  A2: -5.75,
};

/** Dissonance contributed by one pair of partials (sine components). */
export function partialDissonance(f1, a1, f2, a2) {
  const fmin = Math.min(f1, f2);
  const df = Math.abs(f1 - f2);
  const amin = Math.min(a1, a2);
  const S = PL.Dstar / (PL.S1 * fmin + PL.S2);
  return amin * (PL.C1 * Math.exp(PL.A1 * S * df) + PL.C2 * Math.exp(PL.A2 * S * df));
}

export const N_HARMONICS = 6;

// The relative partial amplitudes (sawtooth-weighted, a_k = 1/k) that roughness
// assumes. The audio synth is built from THIS exact array, so the spectrum the
// listener hears is the spectrum the geometry was measured from — not a similar
// one. Single source of truth for timbre.
export const SAW_PARTIALS = Array.from({ length: N_HARMONICS }, (_, i) => 1 / (i + 1));

/**
 * The partial spectrum of a single pitch: 6 harmonics, sawtooth-weighted
 * amplitudes (a_k = 1/k). This is the EXACT spectrum the audio synth is built
 * to reproduce, so the listener hears the timbre the roughness was computed for.
 */
export function spectrum(midi, nHarmonics = N_HARMONICS) {
  const f0 = midiToFreq(midi);
  const out = [];
  for (let k = 1; k <= nHarmonics; k++) out.push({ f: f0 * k, a: 1 / k });
  return out;
}

/** Sum of pairwise dissonance over an arbitrary bag of partials. */
function bagDissonance(partials) {
  let d = 0;
  for (let i = 0; i < partials.length; i++) {
    for (let j = i + 1; j < partials.length; j++) {
      d += partialDissonance(partials[i].f, partials[i].a, partials[j].f, partials[j].a);
    }
  }
  return d;
}

/** Cross dissonance between two separate bags of partials (A's vs B's only). */
function crossDissonance(partsA, partsB) {
  let d = 0;
  for (const p of partsA) {
    for (const q of partsB) {
      d += partialDissonance(p.f, p.a, q.f, q.a);
    }
  }
  return d;
}

// Normalisation reference: the cross dissonance of a single minor-second dyad
// (A4 vs A#4) under the same 6-harmonic sawtooth spectrum. A semitone is near
// the worst case of the Plomp-Levelt curve for complex tones, so dividing by it
// puts "one nasty clash" at ~1.0 and lets the geometry bands read in [0,1].
export const ROUGH_REF = crossDissonance(spectrum(69), spectrum(70));

/**
 * Sensory dissonance of a whole sonority (a set of MIDI pitches).
 * We sum dissonance over CROSS-note partial pairs only — the within-note
 * roughness of a single sawtooth is a constant of the timbre, identical for
 * every note, and carries no harmonic information, so excluding it keeps the
 * number a pure measure of how the pitches interact.
 *
 * Returns:
 *   raw        — bare Sethares sum (useful for audio gain shaping)
 *   normalized — raw / (nPairs * ROUGH_REF): ~0 consonant, ~1 = one semitone
 *                clash per voice pair. This is THE number used for colour and
 *                geometry.
 */
export function roughness(midis) {
  const notes = midis.map((m) => spectrum(m));
  let raw = 0;
  let pairs = 0;
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      raw += crossDissonance(notes[i], notes[j]);
      pairs++;
    }
  }
  const normalized = pairs === 0 ? 0 : raw / (pairs * ROUGH_REF);
  return { raw, normalized, pairs };
}

/**
 * How well a single added pitch (a melody/counter peg) seats into a context set
 * (the chord tones, and optionally the other already-sounding pegs).
 * It is the cross dissonance between the peg's spectrum and every context
 * spectrum, normalised the same way as `roughness`. This — and only this —
 * drives the seating depth of a peg.
 */
export function fitRoughness(pegMidi, contextMidis) {
  if (contextMidis.length === 0) return 0;
  const pegParts = spectrum(pegMidi);
  let raw = 0;
  for (const m of contextMidis) raw += crossDissonance(pegParts, spectrum(m));
  return raw / (contextMidis.length * ROUGH_REF);
}

// Seating geometry thresholds (the ONE place roughness becomes depth).
// CALIBRATED to this module's normalization by sweeping every chromatic peg over
// a C-major triad (see test output): clean chord tones in a singing register land
// at fit 0.06-0.17, gentle tensions (9th, maj7) at 0.19-0.30, and an ADJACENT
// minor-second clash at 0.55-0.70. The brief's illustrative "~0.15 flush" assumed
// a different scale; FLUSH/REFUSE below are the empirical band edges for ours.
// seatDepth in (REPEL..1]: 1 = mated flush, 0 = sitting on the rim, negative =
// pushed back out with strain.
export const SEAT = { FLUSH: 0.18, REFUSE: 0.5, REPEL: -0.18 };

/** Continuous, honest seating depth from a fit-roughness score. */
export function seatDepth(fit) {
  if (fit <= SEAT.FLUSH) return 1;
  if (fit >= SEAT.REFUSE) {
    // Beyond refuse: clamp the push-out so it stays visible but bounded.
    const over = Math.min(1, (fit - SEAT.REFUSE) / SEAT.REFUSE);
    return SEAT.REPEL * over;
  }
  // Partial seating: linear gap proportional to roughness between the bands.
  return (SEAT.REFUSE - fit) / (SEAT.REFUSE - SEAT.FLUSH);
}

// ---------------------------------------------------------------------------
// 3. INTERVAL-CLASS VECTOR
// ---------------------------------------------------------------------------

/**
 * Interval-class vector of a set of pitch classes. Index i (0..5) counts
 * unordered interval class i+1. Duplicate pitch classes are collapsed first
 * (a set, in the set-theory sense).
 */
export function intervalClassVector(pcsIn) {
  const set = [...new Set(pcsIn.map((p) => ((p % 12) + 12) % 12))];
  const v = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < set.length; i++) {
    for (let j = i + 1; j < set.length; j++) {
      let d = Math.abs(set[i] - set[j]) % 12;
      if (d > 6) d = 12 - d;
      if (d >= 1 && d <= 6) v[d - 1]++;
    }
  }
  return v;
}

// ---------------------------------------------------------------------------
// 2. VOICE-LEADING DISTANCE (Tymoczko)
// ---------------------------------------------------------------------------
//
// Distance in pitch-class space: each voice moves by the shorter way around the
// 12-tone circle (0..6 semitones). The minimal total displacement over all voice
// assignments is the voice-leading distance. We embed chord objects so physical
// distance approximates this metric (see lattice module / MDS).
//
// Equal-cardinality chords: exact optimum by brute force over permutations
// (n<=7 -> <=5040 perms, trivial and obviously correct — preferred over a
// hand-rolled Hungarian for verifiability). Unequal cardinalities: Tymoczko
// permits doublings, so we pad the smaller chord with copies of its own pitch
// classes (every multiset extension) and take the best — a documented, finite,
// optimal-within-that-model search.

/** Shorter-way pitch-class distance, 0..6. */
export function pcDistance(a, b) {
  let d = Math.abs((((a - b) % 12) + 12) % 12);
  return Math.min(d, 12 - d);
}

function* permutations(arr) {
  if (arr.length <= 1) {
    yield arr.slice();
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) yield [arr[i], ...p];
  }
}

function bestBijection(src, dst) {
  // src, dst equal length arrays of pitch classes -> {distance, pairs}
  let best = Infinity;
  let bestPerm = null;
  for (const perm of permutations(dst)) {
    let total = 0;
    for (let i = 0; i < src.length; i++) total += pcDistance(src[i], perm[i]);
    if (total < best) {
      best = total;
      bestPerm = perm;
    }
  }
  const pairs = src.map((s, i) => ({ from: s, to: bestPerm[i], move: signedPcMove(s, bestPerm[i]) }));
  return { distance: best, pairs };
}

/** Signed shorter-way move from a to b in semitones (-6..6). */
function signedPcMove(a, b) {
  let d = (((b - a) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  return d;
}

// All multisets that extend `base` (length n) up to length `target` by repeating
// existing members. Used only for unequal-cardinality voice leading.
function* paddings(base, target) {
  const extra = target - base.length;
  if (extra === 0) {
    yield base.slice();
    return;
  }
  const idxCombos = function* (start, count, acc) {
    if (count === 0) {
      yield acc.slice();
      return;
    }
    for (let i = start; i < base.length; i++) {
      acc.push(base[i]);
      yield* idxCombos(i, count - 1, acc); // i (not i+1): repeats allowed
      acc.pop();
    }
  };
  for (const combo of idxCombos(0, extra, [])) yield base.concat(combo);
}

/**
 * Minimal voice-leading distance between two chords given as arrays of pitch
 * classes (or any MIDI/pc numbers — reduced mod 12 internally).
 * Returns { distance, assignment } where assignment lists from->to per voice
 * and the signed semitone move, so callers can print/verify by hand.
 */
export function voiceLeading(chordA, chordB) {
  const a = chordA.map((x) => ((x % 12) + 12) % 12);
  const b = chordB.map((x) => ((x % 12) + 12) % 12);

  if (a.length === b.length) {
    const r = bestBijection(a, b);
    return { distance: r.distance, assignment: r.pairs };
  }

  // Unequal: pad the smaller side every possible way, keep the global best.
  let small = a,
    large = b,
    flipped = false;
  if (a.length > b.length) {
    small = b;
    large = a;
    flipped = true;
  }
  let best = Infinity;
  let bestAssign = null;
  for (const padded of paddings(small, large.length)) {
    const r = flipped ? bestBijection(large, padded) : bestBijection(padded, large);
    if (r.distance < best) {
      best = r.distance;
      bestAssign = r.pairs;
    }
  }
  return { distance: best, assignment: bestAssign };
}

// ---------------------------------------------------------------------------
// CHORD PARSING — symbols -> { rootPc, bassPc, pcs, intervals, voicing }
// ---------------------------------------------------------------------------
//
// Handles triad qualities, sixths, sevenths (dom/maj/dim/half-dim/min-maj),
// extensions (9/11/13, implied lower extensions for 11ths & 13ths per common
// practice), alterations (b5 #5 b9 #9 #11 b13), sus2/sus4, add tones, and slash
// bass. Output pcs is the set of pitch classes; voicing is a playable MIDI
// realisation used as the audio default and the lattice anchor.

const QUALITY_ALIASES = [
  // [regex, handler-tag]  — longest / most specific first
  [/^(m7b5|min7b5|m7-5|-7b5|ø7?)/, 'm7b5'],
  [/^(dim7|o7|°7)/, 'dim7'],
  [/^(dim|o|°)/, 'dim'],
  [/^(aug|\+)/, 'aug'],
];

function parseRoot(sym) {
  const m = /^([A-Ga-g])(#{1,2}|b{1,2}|x)?/.exec(sym);
  if (!m) throw new Error(`No root note in chord "${sym}"`);
  return { rootPc: noteNameToPc(m[0]), rest: sym.slice(m[0].length) };
}

function qualityToIntervals(qRaw) {
  let q = qRaw.trim();
  const ints = new Set([0]);

  // --- whole-quality special cases ---
  for (const [re, tag] of QUALITY_ALIASES) {
    if (re.test(q)) {
      const rest = q.replace(re, '');
      if (tag === 'm7b5') [0, 3, 6, 10].forEach((i) => ints.add(i));
      else if (tag === 'dim7') [0, 3, 6, 9].forEach((i) => ints.add(i));
      else if (tag === 'dim') [0, 3, 6].forEach((i) => ints.add(i));
      else if (tag === 'aug') [0, 4, 8].forEach((i) => ints.add(i));
      applyTail(ints, rest, tag);
      return [...ints].sort((x, y) => x - y);
    }
  }

  // --- general path: third, fifth, sixth/seventh, extensions ---
  let third = 4; // major by default
  let fifth = 7;

  // minor third: lowercase m / min / - (but NOT 'maj' / 'M' / 'Δ')
  const minMatch = /^(min|m(?!aj)|-)/.exec(q);
  if (minMatch) {
    third = 3;
    q = q.slice(minMatch[0].length);
  }

  // suspensions replace the third
  let sus = null;
  const susMatch = /^sus(2|4)?/.exec(q);
  if (susMatch) {
    sus = susMatch[1] ? Number(susMatch[1]) : 4;
    q = q.slice(susMatch[0].length);
  }

  // maj7 marker (maj / M / Δ / major) optionally followed by extension number
  let seventh = null; // 10 = b7, 11 = maj7
  const majMatch = /^(maj|major|M|Δ)/.exec(q);
  if (majMatch) {
    seventh = 11;
    q = q.slice(majMatch[0].length);
  }

  // the chord "size" number: 6, 7, 9, 11, 13 (5 = power-ish, leave triad)
  let size = null;
  const numMatch = /^(13|11|9|7|6|5)/.exec(q);
  if (numMatch) {
    size = Number(numMatch[0]);
    q = q.slice(numMatch[0].length);
  }

  // assemble third / fifth / sus
  if (sus === 2) {
    ints.add(2);
    ints.add(fifth);
  } else if (sus === 4) {
    ints.add(5);
    ints.add(fifth);
  } else {
    ints.add(third);
    ints.add(fifth);
  }

  // sixth and sevenths / extensions
  if (size === 6) {
    ints.add(9); // major sixth
  } else if (size === 7 || size === 9 || size === 11 || size === 13) {
    if (seventh === null) seventh = 10; // dominant 7th unless maj marked
    ints.add(seventh);
    if (size >= 9) ints.add(2); // 9th
    if (size >= 11) ints.add(5); // 11th (implied lower extension)
    if (size >= 13) ints.add(9); // 13th
  } else if (seventh === 11 && size === null) {
    // bare "maj" with no number = major triad; "maj7" already had size handled.
    // If someone wrote just "maj", treat as triad (seventh stays unused).
    seventh = null;
  }
  if (seventh === 11 && size === null && majMatch) {
    // "Cmaj7" path actually sets size=7 above; "Cmaj" alone -> triad (handled).
  }

  applyTail(ints, q, 'general', { fifth });
  return [...ints].sort((x, y) => x - y);
}

// Trailing alterations / adds, shared by all paths.
function applyTail(ints, tail, tag, ctx = {}) {
  let t = tail.trim();
  // strip stray separators
  t = t.replace(/^[\s/]+/, '');

  const tokens = t.match(/(add\d+|b5|#5|\+5|-5|b9|#9|b13|#11|b6|6|9|11|13|2|4)/g) || [];
  for (const tok of tokens) {
    switch (tok) {
      case 'add9':
      case '9':
        ints.add(2);
        break;
      case 'add11':
      case '11':
        ints.add(5);
        break;
      case 'add13':
      case '13':
        ints.add(9);
        break;
      case '6':
        ints.add(9);
        break;
      case '2':
        ints.add(2);
        break;
      case '4':
        ints.add(5);
        break;
      case 'b5':
      case '-5':
        ints.delete(7);
        ints.add(6);
        break;
      case '#5':
      case '+5':
        ints.delete(7);
        ints.add(8);
        break;
      case 'b9':
        ints.add(1);
        break;
      case '#9':
        ints.add(3);
        break;
      case '#11':
        ints.add(6);
        break;
      case 'b13':
        ints.add(8);
        break;
      case 'b6':
        ints.add(8);
        break;
      default:
        break;
    }
  }
}

/**
 * Build a close, playable MIDI voicing for a chord, root near `anchor`.
 * Slash bass (if any) is placed below the body. Used as the audio default and
 * as the chord's anchor pitch set for the lattice; the explorer voices melodies
 * separately.
 */
function buildVoicing(rootPc, intervals, bassPc, anchor = 60) {
  // place root in [anchor-6, anchor+5]
  let root = anchor + (((rootPc - (anchor % 12)) % 12) + 12) % 12;
  if (root - anchor > 6) root -= 12;
  const body = intervals.map((iv) => root + iv);
  if (bassPc !== null && bassPc !== undefined) {
    // bass note an octave-ish below the root
    let bass = root - 12 + (((bassPc - ((root - 12) % 12)) % 12) + 12) % 12;
    if (bass >= root) bass -= 12;
    return { voicing: [bass, ...body], rootMidi: root };
  }
  return { voicing: body, rootMidi: root };
}

export function parseChord(symbol) {
  const sym = symbol.trim();
  if (!sym) throw new Error('Empty chord symbol');

  // slash bass
  let chordPart = sym;
  let bassPc = null;
  const slash = sym.lastIndexOf('/');
  if (slash > 0) {
    const after = sym.slice(slash + 1);
    if (/^[A-Ga-g](#{1,2}|b{1,2}|x)?$/.test(after.trim())) {
      bassPc = noteNameToPc(after.trim());
      chordPart = sym.slice(0, slash);
    }
  }

  const { rootPc, rest } = parseRoot(chordPart);
  const intervals = qualityToIntervals(rest);
  const pcsSet = new Set(intervals.map((iv) => (rootPc + iv) % 12));
  if (bassPc !== null) pcsSet.add(bassPc);
  const pcs = [...pcsSet].sort((a, b) => a - b);
  const { voicing, rootMidi } = buildVoicing(rootPc, intervals, bassPc);

  return {
    symbol: sym,
    rootPc,
    bassPc: bassPc === null ? rootPc : bassPc,
    intervals, // semitones above root
    pcs, // pitch-class set (incl. bass)
    voicing, // MIDI realisation
    rootMidi, // voiced root pitch — melody pegs register relative to this so the
    // whole scene transposes rigidly (only hue rotates) under a key change
  };
}

/** Parse a whitespace-separated progression like "Dm7 G7 Cmaj7". */
export function parseProgression(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseChord);
}

// ---------------------------------------------------------------------------
// COLOUR — hue from the pitch-class chroma circle (transposition = hue rotation,
// a real symmetry); saturation/lightness from roughness. No other colour logic.
// Returns HSL with h in [0,360). Kept here so colour is provably model-derived.
// ---------------------------------------------------------------------------

/** Hue (degrees) for a pitch class: chroma circle, C at 0deg, +30deg/semitone. */
export function pcHue(p) {
  return (((p % 12) + 12) % 12) * 30;
}

/**
 * Colour for a sonority: hue = chroma centroid of its pitch classes (circular
 * mean, so it rotates rigidly under transposition); saturation falls and the
 * emissive boost we expose rises with normalized roughness.
 */
export function sonorityColor(pcs, normRoughness) {
  // circular mean of hues
  let x = 0,
    y = 0;
  for (const p of pcs) {
    const a = (pcHue(p) * Math.PI) / 180;
    x += Math.cos(a);
    y += Math.sin(a);
  }
  let hue = (Math.atan2(y, x) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const r = Math.max(0, Math.min(1, normRoughness));
  return {
    h: hue,
    s: 0.75 - 0.45 * r, // consonant = saturated & clean, rough = washed out
    l: 0.55 - 0.12 * r,
    emissive: r, // 0 calm -> 1 straining; geometry/material reads this
  };
}
