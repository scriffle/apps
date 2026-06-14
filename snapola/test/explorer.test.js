// Unit tests for the combinatorial explorer. Run: node test/explorer.test.js
import * as H from '../src/harmony.js';
import * as E from '../src/explorer.js';

let passed = 0,
  failed = 0;
const failures = [];
function ok(c, m) {
  if (c) passed++;
  else {
    failed++;
    failures.push(m);
    console.log('  ✗ ' + m);
  }
}
function section(s) {
  console.log('\n# ' + s);
}

// ---------------------------------------------------------------------------
section('parallel perfect 5ths / octaves detection');
// C5/F4 (P5) -> D5/G4 (P5), both voices up a step = textbook parallel fifths.
ok(E.parallelPerfect(72, 65, 74, 67), 'C5/F4 → D5/G4 is parallel fifths');
// octaves: C5/C4 -> D5/D4
ok(E.parallelPerfect(72, 60, 74, 62), 'C5/C4 → D5/D4 is parallel octaves');
// contrary motion into a fifth is NOT parallel
ok(!E.parallelPerfect(72, 65, 71, 66), 'contrary motion into a fifth is not flagged');
// a parallel FOURTH is allowed (not perfect 5th/8ve)
ok(!E.parallelPerfect(72, 67, 74, 69), 'parallel fourths are allowed');
// oblique (one voice static) is fine
ok(!E.parallelPerfect(72, 65, 72, 67), 'oblique motion is not parallel');

// ---------------------------------------------------------------------------
section('rankBeat returns a sorted top-N');
const Cmaj = [60, 64, 67];
const cands = [67, 69, 71, 72, 74, 76, 79]; // melody candidates over C major
const ranked = E.rankBeat({ chordVoicing: Cmaj, melodyCandidates: cands, topN: 4 });
ok(ranked.length === 4, 'respects topN');
ok(ranked.every((r, i) => i === 0 || ranked[i - 1].cost <= r.cost), 'sorted ascending by cost');
console.log('    best melody over C:', H.pcToName(ranked[0].melody % 12) + (Math.floor(ranked[0].melody / 12) - 1), 'cost', ranked[0].cost.toFixed(3));
ok(ranked[0].rough <= ranked[ranked.length - 1].rough + 1e-9, 'lower-cost picks are at least as smooth');

// ---------------------------------------------------------------------------
section('ACCEPTANCE 4 — parallel-5ths penalty visibly reorders 2nd-line picks');
// Fixed melody D5 over a G chord; previous beat formed a P5 (C5 over F4). Rank
// COUNTER candidates with the penalty OFF, then ON. The G4 counter makes parallel
// fifths and must fall in the ranking when the penalty is enabled.
const Gtriad = [55, 59, 62]; // G B D
const prev = { melody: 72, counter: 65 }; // C5 / F4  (a perfect fifth)
const melodyFixed = [74]; // D5
const counters = [62, 64, 66, 67, 69, 71]; // D4..B4 incl. G4=67 (the parallel one)

const off = E.rankBeat({
  chordVoicing: Gtriad,
  melodyCandidates: melodyFixed,
  counterCandidates: counters,
  prev,
  weights: { roughness: 1, voiceLeading: 0.6, parallel: 0 },
  topN: counters.length,
});
const on = E.rankBeat({
  chordVoicing: Gtriad,
  melodyCandidates: melodyFixed,
  counterCandidates: counters,
  prev,
  weights: { roughness: 1, voiceLeading: 0.6, parallel: 0.8 },
  topN: counters.length,
});
const orderOff = off.map((r) => r.counter);
const orderOn = on.map((r) => r.counter);
const rankOf = (list, c) => list.findIndex((r) => r.counter === c);
console.log('    penalty OFF order:', orderOff.map((c) => H.pcToName(c % 12)).join(' '));
console.log('    penalty ON  order:', orderOn.map((c) => H.pcToName(c % 12)).join(' '));
console.log(`    G4 (parallel) rank: off=${rankOf(off, 67)} on=${rankOf(on, 67)}`);
ok(JSON.stringify(orderOff) !== JSON.stringify(orderOn), 'enabling the penalty reorders the suggestions');
ok(rankOf(on, 67) > rankOf(off, 67), 'the parallel-fifth counter (G4) ranks worse with the penalty on');
ok(on.find((r) => r.counter === 67).parallel === true, 'G4 is flagged parallel');

// ---------------------------------------------------------------------------
section('solveProgression returns one choice per beat (DP)');
const prog = H.parseProgression('Dm7 G7 Cmaj7');
const beats = prog.map((c) => ({
  chordVoicing: c.voicing,
  melodyCandidates: [72, 74, 76, 77, 79],
  counterCandidates: [60, 62, 64, 65, 67],
}));
const sol = E.solveProgression({ beats, weights: E.DEFAULT_WEIGHTS, withCounter: true });
ok(sol.path.length === 3, 'one choice per beat');
ok(sol.path.every((p) => p.melody != null && p.counter != null), 'each beat has melody + counter');
ok(Number.isFinite(sol.total), 'total cost is finite');
console.log('    chosen melody line:', sol.path.map((p) => H.pcToName(p.melody % 12)).join(' '), '· total', sol.total.toFixed(3));

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(48)}`);
console.log(`PASSED ${passed}   FAILED ${failed}`);
if (failed) {
  console.log('\nFAILURES:');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
} else console.log('All explorer tests green.');
