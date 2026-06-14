// =============================================================================
// lattice.js — places chord solids in voice-leading space.
//
// WHY MDS, NOT THE SPIRAL ARRAY (the brief said pick one and justify):
// The brief's hard requirement is "physical distance between chord objects =
// voice-leading distance." Chew's spiral array embeds pitches on a fixed helix
// and measures harmonic proximity as Euclidean distance there — elegant, but its
// distances are NOT the Tymoczko voice-leading distances we compute; they would
// be a *different* metric grafted on. Instead we take the actual VL-distance
// matrix from HarmonyModel and embed it directly with classical multidimensional
// scaling, choosing the 3D configuration whose pairwise Euclidean distances best
// reproduce the VL distances. The VL metric isn't exactly Euclidean-embeddable,
// so some stress is unavoidable; we report it, scale to the best-fit semitone
// unit, and annotate every edge with the exact VL number. That keeps the spatial
// claim honest: short move on screen ⇒ small voice-leading move, measurably.
// =============================================================================

import * as H from './harmony.js';

/** Voice-leading distance matrix (symmetric, zero diagonal) for parsed chords. */
export function vlMatrix(chords) {
  const n = chords.length;
  const D = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = H.voiceLeading(chords[i].pcs, chords[j].pcs).distance;
      D[i][j] = d;
      D[j][i] = d;
    }
  }
  return D;
}

// --- symmetric eigensolver: cyclic Jacobi rotations (exact for small n) -------
function jacobiEigen(Ain, maxSweeps = 100, eps = 1e-12) {
  const n = Ain.length;
  const A = Ain.map((r) => r.slice());
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    // off-diagonal magnitude
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < eps) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-15) continue;
        const app = A[p][p],
          aqq = A[q][q],
          apq = A[p][q];
        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        const c = Math.cos(phi),
          s = Math.sin(phi);
        for (let k = 0; k < n; k++) {
          const akp = A[k][p],
            akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k],
            aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p],
            vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const values = A.map((_, i) => A[i][i]);
  return { values, vectors: V }; // vectors columns are eigenvectors
}

/**
 * Classical (Torgerson) MDS of a distance matrix into k dims.
 * Returns { coords: n×k, eigvals: top-k, stress }.
 */
export function classicalMDS(D, k = 3) {
  const n = D.length;
  if (n === 0) return { coords: [], eigvals: [], stress: 0 };
  if (n === 1) return { coords: [[0, 0, 0]], eigvals: [0, 0, 0], stress: 0 };

  // double centering: B = -1/2 J D^2 J
  const D2 = D.map((row) => row.map((v) => v * v));
  const rowMean = D2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const grand = rowMean.reduce((a, b) => a + b, 0) / n;
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => -0.5 * (D2[i][j] - rowMean[i] - rowMean[j] + grand))
  );

  const { values, vectors } = jacobiEigen(B);
  // rank dims by eigenvalue descending; keep top-k non-negative
  const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
  const coords = Array.from({ length: n }, () => new Array(k).fill(0));
  const eigvals = [];
  for (let d = 0; d < k; d++) {
    const idx = order[d];
    const lam = Math.max(0, values[idx] ?? 0);
    eigvals.push(values[idx] ?? 0);
    const scale = Math.sqrt(lam);
    for (let i = 0; i < n; i++) coords[i][d] = vectors[i][idx] * scale;
  }

  // best-fit scale so Euclidean ≈ VL (least squares on the off-diagonal)
  let num = 0,
    den = 0;
  const euc = (i, j) => Math.hypot(...coords[i].map((c, d) => c - coords[j][d]));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const e = euc(i, j);
      num += e * D[i][j];
      den += e * e;
    }
  const s = den > 0 ? num / den : 1;
  for (let i = 0; i < n; i++) for (let d = 0; d < k; d++) coords[i][d] *= s;

  // Kruskal-style stress of the scaled embedding vs the true VL distances
  let sNum = 0,
    sDen = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const e = Math.hypot(...coords[i].map((c, d) => c - coords[j][d]));
      sNum += (e - D[i][j]) ** 2;
      sDen += D[i][j] ** 2;
    }
  const stress = sDen > 0 ? Math.sqrt(sNum / sDen) : 0;

  return { coords, eigvals, stress };
}

/**
 * Full layout for a progression: VL matrix, 3D coords (world units already in
 * semitones, since MDS was best-fit to the VL distances), and the consecutive
 * edges annotated with exact VL distance + the optimal voice assignment.
 */
export function layoutProgression(chords) {
  const D = vlMatrix(chords);
  const { coords, stress, eigvals } = classicalMDS(D, 3);
  const edges = [];
  for (let i = 0; i + 1 < chords.length; i++) {
    const vl = H.voiceLeading(chords[i].pcs, chords[i + 1].pcs);
    edges.push({ from: i, to: i + 1, distance: vl.distance, assignment: vl.assignment });
  }
  return { matrix: D, coords, edges, stress, eigvals };
}
