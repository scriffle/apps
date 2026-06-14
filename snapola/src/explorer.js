// =============================================================================
// explorer.js — ranks melody / second-line choices for a beat.
//
// Pure (no THREE, no DOM) so it unit-tests in Node. Operates on MIDI numbers;
// the app supplies the candidate pitches for a beat's register range.
//
// Cost = wRough · sensory roughness(chord+lines)            [psychoacoustics]
//      + wVL    · (melody leap + counter leap)/12           [smooth lines]
//      + wPar   · parallel-perfect-5th/8ve flag             [STYLISTIC convention]
//
// The parallel-motion term is explicitly NOT psychoacoustics — it is a Western
// common-practice convention. Its weight is user-adjustable and defaults on; the
// UI must label it as convention, not physics.
// =============================================================================

import * as H from './harmony.js';

export const DEFAULT_WEIGHTS = { roughness: 1.0, voiceLeading: 0.6, parallel: 0.8 };

/**
 * True when the two voices move in similar motion into the SAME perfect interval
 * (unison/octave = 0 mod 12, or perfect fifth = 7) they already formed — i.e.
 * consecutive (parallel) perfect 5ths or octaves. Perfect fourths are allowed,
 * as convention does.
 */
export function parallelPerfect(melPrev, ctrPrev, melNow, ctrNow) {
  if (melPrev == null || ctrPrev == null || melNow == null || ctrNow == null) return false;
  const ic = (a, b) => Math.abs(a - b) % 12;
  const isPerfect = (x) => x === 0 || x === 7; // octave/unison or fifth
  const i0 = ic(melPrev, ctrPrev);
  const i1 = ic(melNow, ctrNow);
  if (!isPerfect(i0) || !isPerfect(i1) || i0 !== i1) return false;
  const dMel = melNow - melPrev;
  const dCtr = ctrNow - ctrPrev;
  if (dMel === 0 || dCtr === 0) return false; // oblique/static motion is fine
  return Math.sign(dMel) === Math.sign(dCtr); // similar motion = parallel
}

/** Cost breakdown for one (melody, counter) choice on a beat. */
export function beatCost(chordVoicing, melMidi, ctrMidi, prev, weights = DEFAULT_WEIGHTS) {
  const tones = [...chordVoicing, melMidi];
  if (ctrMidi != null) tones.push(ctrMidi);
  const rough = H.roughness(tones).normalized;

  const vlMel = prev && prev.melody != null ? Math.abs(melMidi - prev.melody) : 0;
  const vlCtr = prev && prev.counter != null && ctrMidi != null ? Math.abs(ctrMidi - prev.counter) : 0;

  const parallel =
    ctrMidi != null && prev && prev.melody != null && prev.counter != null
      ? parallelPerfect(prev.melody, prev.counter, melMidi, ctrMidi)
      : false;

  const cost =
    weights.roughness * rough +
    weights.voiceLeading * ((vlMel + vlCtr) / 12) +
    weights.parallel * (parallel ? 1 : 0);

  return { cost, rough, vlMel, vlCtr, parallel };
}

/**
 * Rank candidate beat realisations.
 *   chordVoicing       — MIDI tones of the chord
 *   melodyCandidates   — MIDI pitches allowed for the melody this beat
 *   counterCandidates  — MIDI pitches allowed for the 2nd line (omit/empty -> none)
 *   prev               — { melody, counter } committed on the previous beat (or null)
 *   weights, topN
 * Returns the top-N { melody, counter, cost, rough, vlMel, vlCtr, parallel }.
 */
export function rankBeat({
  chordVoicing,
  melodyCandidates,
  counterCandidates = null,
  prev = null,
  weights = DEFAULT_WEIGHTS,
  topN = 8,
}) {
  const out = [];
  const withCounter = counterCandidates && counterCandidates.length > 0;
  for (const m of melodyCandidates) {
    if (withCounter) {
      for (const c of counterCandidates) {
        out.push({ melody: m, counter: c, ...beatCost(chordVoicing, m, c, prev, weights) });
      }
    } else {
      out.push({ melody: m, counter: null, ...beatCost(chordVoicing, m, null, prev, weights) });
    }
  }
  // stable-ish sort by cost, then by smaller leaps as a tiebreak
  out.sort((a, b) => a.cost - b.cost || a.vlMel + a.vlCtr - (b.vlMel + b.vlCtr));
  return out.slice(0, topN);
}

/**
 * Optimal melody+counter path through a whole progression by dynamic programming
 * (Viterbi over candidate states per beat), so voice-leading and parallel costs
 * across beats are globally minimised rather than greedily. Returns one chosen
 * { melody, counter } per beat plus the total cost.
 */
export function solveProgression({ beats, weights = DEFAULT_WEIGHTS, withCounter = true }) {
  // beats: [{ chordVoicing, melodyCandidates, counterCandidates }]
  if (!beats.length) return { path: [], total: 0 };
  const states = beats.map((b) =>
    withCounter && b.counterCandidates && b.counterCandidates.length
      ? b.melodyCandidates.flatMap((m) => b.counterCandidates.map((c) => ({ melody: m, counter: c })))
      : b.melodyCandidates.map((m) => ({ melody: m, counter: null }))
  );

  const n = beats.length;
  const dp = states.map((s) => s.map(() => Infinity));
  const back = states.map((s) => s.map(() => -1));

  for (let si = 0; si < states[0].length; si++) {
    const s = states[0][si];
    dp[0][si] = beatCost(beats[0].chordVoicing, s.melody, s.counter, null, weights).cost;
  }
  for (let t = 1; t < n; t++) {
    for (let si = 0; si < states[t].length; si++) {
      const s = states[t][si];
      for (let pj = 0; pj < states[t - 1].length; pj++) {
        if (dp[t - 1][pj] === Infinity) continue;
        const prev = states[t - 1][pj];
        const c = dp[t - 1][pj] + beatCost(beats[t].chordVoicing, s.melody, s.counter, prev, weights).cost;
        if (c < dp[t][si]) {
          dp[t][si] = c;
          back[t][si] = pj;
        }
      }
    }
  }

  let bi = 0;
  for (let si = 1; si < states[n - 1].length; si++) if (dp[n - 1][si] < dp[n - 1][bi]) bi = si;
  const total = dp[n - 1][bi];
  const path = new Array(n);
  for (let t = n - 1; t >= 0; t--) {
    path[t] = states[t][bi];
    bi = back[t][bi];
  }
  return { path, total };
}
