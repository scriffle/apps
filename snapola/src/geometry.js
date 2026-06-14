// =============================================================================
// geometry.js — turns HarmonyModel outputs into Three.js meshes.
//
// EVERYTHING here is a render of a model number. The rules, and the only rules:
//   - a socket's openness (how deep a peg can seat)      <- seatDepth(fitRoughness)
//   - a socket's rim profile (the bumps that mate/clash) <- pairwise roughness
//   - every hue                                          <- pitch-class chroma circle
//   - every saturation/emissive                          <- roughness
// If a value here isn't traceable to harmony.js, it's a layout constant (radius,
// height) with no musical meaning — never a disguised musical choice.
// =============================================================================

import * as THREE from 'three';
import * as H from './harmony.js';

// --- layout constants (pure staging; carry no musical meaning) ---------------
export const BODY_R = 2.4;
export const BODY_H = 1.2;
export const TOP_Y = BODY_H / 2; // top face of the chord body
export const SOCK_RING_R = 1.55; // radius of the ring of sockets on the top face
export const SOCK_OPEN_R = 0.3; // inner radius of a socket opening
export const SOCK_DEPTH = 0.72; // how far a fully-open socket sinks into the body
export const PEG_R = 0.26;
export const PEG_H = 1.5;
export const REFUSE_LIFT = 0.9; // how far a refused peg is pushed above the rim

/** MIDI for a pitch class realised in a given absolute octave (C4 = 60). */
export function pcMidi(pc, octave) {
  return 12 * (octave + 1) + (((pc % 12) + 12) % 12);
}

/**
 * MIDI for a melody/peg pitch class in an ABSOLUTE register (chord arg kept for
 * call-site symmetry but unused). Melody lives in one consistent octave across a
 * whole progression so the line is smooth and cross-beat voice-leading is honest
 * — a chord-root-relative register would make the line jump octaves between
 * chords whose roots voice in different octaves. Transposition invariance
 * (acceptance test 2) is a WHOLE-SCENE transpose (every chord + the register
 * shift together), verified numerically in the debug panel; a single chord
 * change is not a transposition and legitimately changes fits.
 */
export function melodyMidi(pc, _chord, octave) {
  return pcMidi(pc, octave);
}

/**
 * Chroma-circle angle (radians) for a pitch class. Derived straight from the
 * model's hue so that the spatial layout and the colour wheel are the SAME
 * circle — C at the front, advancing clockwise a semitone at a time.
 */
export function chromaAngle(pc) {
  return Math.PI / 2 - (H.pcHue(pc) * Math.PI) / 180;
}

/** (x,z) position of a socket / chroma slot on the top ring. */
export function chromaXZ(pc, radius = SOCK_RING_R) {
  const a = chromaAngle(pc);
  return { x: Math.cos(a) * radius, z: -Math.sin(a) * radius };
}

function hslColor(h, s, l) {
  return new THREE.Color().setHSL((((h % 360) + 360) % 360) / 360, s, l);
}

// --- the socket rim profile: a radial bump function from pairwise roughness ---
//
// For pitch class `pc` over a chord, the rim radius at angle φ swells toward each
// chord tone in proportion to how rough `pc` is against that tone. A chord tone
// (or a consonant note) yields a smooth, low ring that a peg's smooth collar can
// mate with; a clashing note grows spikes pointing at the tones it beats with —
// a gear that visibly cannot seat. σ is a layout smoothing width only.
function profileRadius(pc, chordPcs, phi, R0, amp) {
  const sigma = 0.55;
  let bump = 0;
  for (const ct of chordPcs) {
    const a = chromaAngle(ct);
    let d = phi - a;
    d = Math.atan2(Math.sin(d), Math.cos(d)); // wrap to [-π, π]
    const rough = H.roughness([pcMidi(pc, 5), pcMidi(ct, 5)]).normalized; // interval-class roughness
    bump += rough * Math.exp(-(d * d) / (2 * sigma * sigma));
  }
  return R0 + amp * bump;
}

function buildProfileRing(pc, chordPcs) {
  const seg = 96;
  const R0 = SOCK_OPEN_R + 0.14;
  const amp = 0.5;
  const shape = new THREE.Shape();
  for (let i = 0; i <= seg; i++) {
    const phi = (i / seg) * Math.PI * 2;
    const r = profileRadius(pc, chordPcs, phi, R0, amp);
    const x = Math.cos(phi) * r;
    const y = Math.sin(phi) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  for (let i = 0; i <= seg; i++) {
    const phi = (i / seg) * Math.PI * 2;
    hole.absarc(0, 0, SOCK_OPEN_R, phi, phi, false);
    const x = Math.cos(phi) * SOCK_OPEN_R;
    const y = Math.sin(phi) * SOCK_OPEN_R;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // lay flat in XZ
  return geo;
}

/** Simple canvas text sprite for socket note-name / edge labels. */
export function makeLabel(text, color = '#cfd8e6') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = 'bold 40px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(0.7, 0.35, 1);
  return sprite;
}

/**
 * Build the chord solid: a faceted body plus one socket per playable pitch class.
 * Returns { group, sockets } where each socket carries the data the interaction
 * and audio layers need. `chord` is a HarmonyModel parseChord() result.
 */
export function buildChordSolid(chord, relOct) {
  const group = new THREE.Group();
  const chordPcs = chord.pcs;
  const sonRough = H.roughness(chord.voicing).normalized;

  // body — a 12-gon prism, hue = sonority chroma centroid, washed out by roughness
  const col = H.sonorityColor(chordPcs, sonRough);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: hslColor(col.h, col.s * 0.7, col.l * 0.5),
    metalness: 0.1,
    roughness: 0.65,
    emissive: hslColor(col.h, col.s, 0.2),
    emissiveIntensity: 0.15 + 0.5 * sonRough,
    flatShading: true,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(BODY_R, BODY_R * 1.04, BODY_H, 12), bodyMat);
  group.add(body);
  const baseEmissive = bodyMat.emissiveIntensity;

  const sockets = [];
  for (let pc = 0; pc < 12; pc++) {
    const isChordTone = chordPcs.includes(pc);
    const { x, z } = chromaXZ(pc);
    const midi = melodyMidi(pc, chord, relOct);
    const fit = H.fitRoughness(midi, chord.voicing);
    const depth = H.seatDepth(fit); // -0.18..1
    const seat01 = Math.max(0, Math.min(1, depth));

    const sock = new THREE.Group();
    sock.position.set(x, TOP_Y, z);

    // recess wall (a dark cup sunk into the body)
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(SOCK_OPEN_R, SOCK_OPEN_R * 0.92, SOCK_DEPTH, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x0b0e14, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 })
    );
    wall.position.y = -SOCK_DEPTH / 2;
    sock.add(wall);

    // plug — rises from the socket floor to block dissonant pegs. Its top is
    // exactly where a peg of this pitch class will rest (seat depth made solid).
    const plugH = (1 - seat01) * SOCK_DEPTH;
    const pcCol = H.pcHue(pc);
    const plug = new THREE.Mesh(
      new THREE.CylinderGeometry(SOCK_OPEN_R * 0.96, SOCK_OPEN_R * 0.96, Math.max(0.02, plugH), 24),
      new THREE.MeshStandardMaterial({
        color: hslColor(pcCol, 0.2 + 0.5 * fit, 0.12 + 0.15 * fit),
        emissive: hslColor(pcCol, 0.8, 0.25),
        emissiveIntensity: 0.1 + 0.9 * fit,
        roughness: 0.8,
        metalness: 0.05,
      })
    );
    plug.position.y = -SOCK_DEPTH + Math.max(0.02, plugH) / 2;
    sock.add(plug);

    // rim profile ring — hue = this pitch class, brightness from its fit
    const ring = new THREE.Mesh(
      buildProfileRing(pc, chordPcs),
      new THREE.MeshStandardMaterial({
        color: hslColor(pcCol, isChordTone ? 0.7 : 0.45, isChordTone ? 0.5 : 0.32),
        emissive: hslColor(pcCol, 0.9, 0.3),
        emissiveIntensity: isChordTone ? 0.35 : 0.12,
        metalness: 0.1,
        roughness: 0.5,
        flatShading: true,
      })
    );
    ring.position.y = 0.02;
    sock.add(ring);

    const label = makeLabel(H.pcToName(pc), isChordTone ? '#eaf0ff' : '#7c879b');
    label.position.set(x * 1.28, TOP_Y + 0.35, z * 1.28);
    group.add(label);

    group.add(sock);
    sockets.push({
      pc,
      midi,
      isChordTone,
      fit,
      seatDepth: depth,
      worldX: x,
      worldZ: z,
      group: sock,
      plug,
      ring,
      label,
    });
  }

  return { group, sockets, body, bodyMat, baseEmissive, sonorityRoughness: sonRough, color: col };
}

/**
 * A compact chord glyph for the lattice view: a small faceted token coloured by
 * the sonority (hue = chroma centroid, wash/emissive = roughness) with chord-tone
 * pips around its rim and a floating symbol label. Cheap enough to render one per
 * beat without the full socket machinery.
 */
export function buildChordGlyph(chord) {
  const group = new THREE.Group();
  const sonRough = H.roughness(chord.voicing).normalized;
  const col = H.sonorityColor(chord.pcs, sonRough);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: hslColor(col.h, col.s, col.l),
    metalness: 0.15,
    roughness: 0.5,
    emissive: hslColor(col.h, 0.9, 0.3),
    emissiveIntensity: 0.18 + 0.5 * sonRough,
    flatShading: true,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.42, 12), bodyMat);
  group.add(body);
  const baseEmissive = bodyMat.emissiveIntensity;

  // chord-tone pips on the chroma circle (hue = pitch class)
  for (const pc of chord.pcs) {
    const { x, z } = chromaXZ(pc, 0.62);
    const pip = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 10),
      new THREE.MeshStandardMaterial({ color: hslColor(H.pcHue(pc), 0.7, 0.55), emissive: hslColor(H.pcHue(pc), 0.9, 0.4), emissiveIntensity: 0.5 })
    );
    pip.position.set(x, 0.22, z);
    group.add(pip);
  }

  const label = makeLabel(chord.symbol, '#eaf0ff');
  label.scale.set(0.78, 0.39, 1);
  label.position.set(0, 0.72, 0);
  group.add(label);

  group.userData = { bodyMat, baseEmissive, label };
  return group;
}

/** A melody/counter peg. `tone` distinguishes the two voices visually. */
export function buildPeg(kind = 'melody') {
  const group = new THREE.Group();
  const accent = kind === 'melody' ? 0xffffff : 0x9fb4ff;
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x8a93a6,
    metalness: 0.3,
    roughness: 0.4,
    emissive: 0x223044,
    emissiveIntensity: 0.2,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(PEG_R, PEG_R, PEG_H, 24), shaftMat);
  shaft.position.y = PEG_H / 2;
  group.add(shaft);

  // a smooth collar — the part that mates flush with a consonant rim
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(PEG_R + 0.12, PEG_R + 0.12, 0.14, 24),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.4, roughness: 0.3, emissive: accent, emissiveIntensity: 0.25 })
  );
  collar.position.y = 0.07;
  group.add(collar);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(PEG_R + 0.04, 20, 16),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.4, roughness: 0.3, emissive: accent, emissiveIntensity: 0.3 })
  );
  cap.position.y = PEG_H;
  group.add(cap);

  group.userData = { kind, shaft, collar, cap, shaftMat };
  return group;
}

/** Apply a pitch-class colour and a roughness-driven strain glow to a peg. */
export function tintPeg(peg, pc, fit) {
  const hue = H.pcHue(pc);
  const strain = Math.max(0, Math.min(1, fit));
  const c = hslColor(hue, 0.55 - 0.3 * strain, 0.55 - 0.1 * strain);
  peg.userData.shaftMat.color.copy(c);
  // strain reads as a hot emissive as roughness climbs (model -> material)
  peg.userData.shaftMat.emissive.copy(hslColor(hue + 10 * strain, 0.9, 0.3));
  peg.userData.shaftMat.emissiveIntensity = 0.15 + 0.85 * strain;
}

export { hslColor };
