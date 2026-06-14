// Unit tests for the lattice (classical MDS + VL embedding). Run:
//   node test/lattice.test.js
import * as H from '../src/harmony.js';
import * as L from '../src/lattice.js';

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
function approx(a, b, eps, m) {
  ok(Math.abs(a - b) <= eps, `${m} (got ${a}, expected ${b}±${eps})`);
}
function section(s) {
  console.log('\n# ' + s);
}

const euc = (a, b) => Math.hypot(...a.map((c, i) => c - b[i]));
function distMatrix(P) {
  return P.map((a) => P.map((b) => euc(a, b)));
}

// ---------------------------------------------------------------------------
section('MDS recovers a known Euclidean configuration');
// An arbitrary 3D point set; MDS of its distance matrix must reproduce those
// distances (up to rotation/reflection) — i.e. stress ≈ 0.
const P = [
  [0, 0, 0],
  [3, 0, 0],
  [0, 4, 0],
  [1, 1, 5],
  [-2, 2, 1],
];
const D = distMatrix(P);
const { coords, stress } = L.classicalMDS(D, 3);
let maxErr = 0;
for (let i = 0; i < P.length; i++)
  for (let j = i + 1; j < P.length; j++) {
    maxErr = Math.max(maxErr, Math.abs(euc(coords[i], coords[j]) - D[i][j]));
  }
console.log(`    max pairwise distance error = ${maxErr.toExponential(2)}, stress = ${stress.toExponential(2)}`);
ok(maxErr < 1e-6, 'embedded distances match original Euclidean distances');
ok(stress < 1e-6, 'stress ≈ 0 for a Euclidean input');

// ---------------------------------------------------------------------------
section('voice-leading matrix is correct & symmetric');
const prog = H.parseProgression('Dm7 G7 Cmaj7');
const M = L.vlMatrix(prog);
ok(M[0][0] === 0 && M[1][1] === 0 && M[2][2] === 0, 'zero diagonal');
ok(M[0][1] === M[1][0] && M[1][2] === M[2][1], 'symmetric');
console.log(`    Dm7→G7=${M[0][1]}  G7→Cmaj7=${M[1][2]}  Dm7→Cmaj7=${M[0][2]}`);
ok(M[0][1] === 3, 'Dm7→G7 = 3 semitones');
ok(M[1][2] === 3, 'G7→Cmaj7 = 3 semitones');

// ---------------------------------------------------------------------------
section('ACCEPTANCE 3 (spatial) — closer chords sit closer on the lattice');
// Dm7 → G7 must be physically nearer than Dm7 → F#maj7 in the embedding.
const prog2 = H.parseProgression('Dm7 G7 F#maj7');
const lay = L.layoutProgression(prog2);
const dG7 = euc(lay.coords[0], lay.coords[1]); // Dm7–G7
const dF7 = euc(lay.coords[0], lay.coords[2]); // Dm7–F#maj7
console.log(`    lattice: Dm7–G7=${dG7.toFixed(2)}  Dm7–F#maj7=${dF7.toFixed(2)}  (VL ${lay.matrix[0][1]} vs ${lay.matrix[0][2]})`);
ok(dG7 < dF7, 'Dm7 sits closer to G7 than to F#maj7 in voice-leading space');
// a 3-chord set embeds exactly in a plane -> physical ≈ VL distance
approx(dG7, lay.matrix[0][1], 1e-6, 'physical distance equals VL distance (3-chord exact embedding)');
approx(dF7, lay.matrix[0][2], 1e-6, 'physical distance equals VL distance (3-chord exact embedding)');
ok(lay.edges.length === 2 && lay.edges[0].distance === 3, 'edges carry exact VL distances + assignments');

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(48)}`);
console.log(`PASSED ${passed}   FAILED ${failed}`);
if (failed) {
  console.log('\nFAILURES:');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
} else console.log('All lattice tests green.');
