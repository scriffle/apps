// =============================================================================
// app.js — scene, input, and wiring for the whole composer.
//   • single-chord view: one solid + draggable pegs, live fit + readout
//   • lattice view: the whole progression embedded in voice-leading space (MDS)
//   • transport: Tone.js playback of the progression, sounding objects glow
// All musical truth lives in harmony.js; meshes in geometry.js / lattice.js.
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as H from './harmony.js';
import * as G from './geometry.js';
import * as L from './lattice.js';
import * as Ex from './explorer.js';
import { AudioEngine } from './audio.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera / lights
// ---------------------------------------------------------------------------
const appEl = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
appEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c11);
scene.fog = new THREE.Fog(0x0a0c11, 16, 40);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
camera.position.set(4.5, 5.2, 7.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.4, 0);
controls.minDistance = 3;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x0a0c11, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(5, 9, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0x6a8cff, 0.7);
rim.position.set(-6, 3, -5);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(80, 64),
  new THREE.MeshStandardMaterial({ color: 0x070910, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -G.BODY_H / 2 - 0.01;
scene.add(ground);
const grid = new THREE.PolarGridHelper(14, 12, 10, 64, 0x1a2030, 0x12161f);
grid.position.y = -G.BODY_H / 2;
scene.add(grid);

// ---------------------------------------------------------------------------
// State — a progression of beats, one selected/edited at a time
// ---------------------------------------------------------------------------
function makeBeat(sym) {
  return { chord: H.parseChord(sym), melodyPc: null, counterPc: null };
}
const state = {
  progression: 'Dm7 G7 Cmaj7'.split(' ').map(makeBeat),
  selected: 0,
  view: 'single', // 'single' | 'lattice'
  octave: 5, // absolute melody register (consistent across the progression)
  voices: { melody: true, counter: false },
  tempo: 96,
  loop: true,
  follow: false,
  playing: false,
  playhead: -1,
};

const selectedBeat = () => state.progression[state.selected];
const currentChord = () => selectedBeat().chord;
const chordMidis = () => currentChord().voicing;
const melMidi = (pc, chord = currentChord()) => G.melodyMidi(pc, chord, state.octave);

// ---------------------------------------------------------------------------
// Single-chord view: solid + pegs
// ---------------------------------------------------------------------------
const singleRoot = new THREE.Group();
scene.add(singleRoot);
let chordSolid = null;

const pegs = {
  melody: { mesh: G.buildPeg('melody'), pc: null, approach: 0, fit: 0, seat: 0, pos: new THREE.Vector3() },
  counter: { mesh: G.buildPeg('counter'), pc: null, approach: 0, fit: 0, seat: 0, pos: new THREE.Vector3() },
};
singleRoot.add(pegs.melody.mesh);
singleRoot.add(pegs.counter.mesh);
const HOVER = 1.4;

const ghostGroup = new THREE.Group();
singleRoot.add(ghostGroup);

// explorer state
const explore = {
  open: false,
  withCounter: true,
  topN: 6,
  parallelOn: true,
  weights: { ...Ex.DEFAULT_WEIGHTS },
  suggestions: [],
  hover: -1,
};

function contextFor(which) {
  const base = chordMidis();
  if (which === 'counter' && pegs.melody.pc != null && pegs.melody.approach > 0.5) {
    return [...base, melMidi(pegs.melody.pc)];
  }
  return base;
}

function setPegPitch(which, pc) {
  const peg = pegs[which];
  if (peg.pc === pc) return;
  peg.pc = pc;
  selectedBeat()[which === 'melody' ? 'melodyPc' : 'counterPc'] = pc; // persist to the beat
  const midi = melMidi(pc);
  peg.fit = H.fitRoughness(midi, contextFor(which));
  peg.seat = H.seatDepth(peg.fit);
  G.tintPeg(peg.mesh, pc, peg.fit);
  if (which === 'melody') updateReadout();
}

function rebuildSingle() {
  if (chordSolid) singleRoot.remove(chordSolid.group);
  chordSolid = G.buildChordSolid(currentChord(), state.octave);
  singleRoot.add(chordSolid.group);

  // load this beat's stored pegs (or null)
  for (const which of ['melody', 'counter']) {
    const stored = selectedBeat()[which === 'melody' ? 'melodyPc' : 'counterPc'];
    const peg = pegs[which];
    peg.pc = null;
    if (stored != null) {
      const { x, z } = G.chromaXZ(stored);
      peg.pos.set(x, G.TOP_Y, z);
      setPegPitch(which, stored);
    } else {
      peg.fit = 0;
      peg.seat = 0;
    }
  }
  updateReadout();
  updateChordPcsLabel();
}

function updateChordPcsLabel() {
  const names = currentChord().pcs.map(H.pcToName).join(' ');
  document.getElementById('chordPcs').textContent = `${currentChord().symbol}: ${names} · roughness ${chordSolid.sonorityRoughness.toFixed(3)}`;
}

// ---------------------------------------------------------------------------
// Lattice view: chords embedded in voice-leading space (physical dist ≈ VL dist)
// ---------------------------------------------------------------------------
const latticeRoot = new THREE.Group();
latticeRoot.visible = false;
scene.add(latticeRoot);
let lattice = null; // { glyphs:[{group,beat}], coords, edges, stress, center }

function clearGroup(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse?.((o) => {
      o.geometry?.dispose?.();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.());
    });
  }
}

function rebuildLattice() {
  clearGroup(latticeRoot);
  const chords = state.progression.map((b) => b.chord);
  const lay = L.layoutProgression(chords);
  // centre the embedding at the origin
  const n = lay.coords.length;
  const center = [0, 0, 0];
  for (const c of lay.coords) for (let d = 0; d < 3; d++) center[d] += c[d] / n;
  const pos = lay.coords.map((c) => new THREE.Vector3(c[0] - center[0], (c[1] - center[1]) * 0.7 + 0.4, c[2] - center[2]));

  const glyphs = [];
  for (let i = 0; i < chords.length; i++) {
    const glyph = G.buildChordGlyph(chords[i]);
    glyph.position.copy(pos[i]);
    glyph.userData.beat = i;
    latticeRoot.add(glyph);
    glyphs.push({ group: glyph, beat: i });
  }

  // connecting path + exact VL-distance labels (the spatial claim, made honest)
  for (const e of lay.edges) {
    const a = pos[e.from],
      b = pos[e.to];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x4a5b80, transparent: true, opacity: 0.7 }));
    latticeRoot.add(line);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lbl = G.makeLabel(`${e.distance}`, '#9fb4ff');
    lbl.scale.set(0.5, 0.25, 1);
    lbl.position.copy(mid).add(new THREE.Vector3(0, 0.3, 0));
    latticeRoot.add(lbl);
  }

  lattice = { glyphs, pos, edges: lay.edges, stress: lay.stress };
  document.getElementById('latticeStress') &&
    (document.getElementById('latticeStress').textContent = lay.stress.toFixed(3));
}

function frameLattice() {
  if (!lattice || !lattice.pos.length) return;
  const box = new THREE.Box3();
  lattice.pos.forEach((p) => box.expandByPoint(p));
  const c = box.getCenter(new THREE.Vector3());
  // fit the whole path comfortably in view (account for fov + a margin)
  const span = Math.max(2, box.getSize(new THREE.Vector3()).length());
  const dist = Math.max(8, span / (2 * Math.tan((camera.fov * Math.PI) / 360)) + span * 0.5);
  controls.target.copy(c);
  camera.position.set(c.x + dist * 0.45, c.y + dist * 0.5, c.z + dist * 0.85);
}

// ---------------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------------
function setView(view) {
  state.view = view;
  singleRoot.visible = view === 'single';
  latticeRoot.visible = view === 'lattice';
  document.getElementById('viewSingle').classList.toggle('on', view === 'single');
  document.getElementById('viewLattice').classList.toggle('on', view === 'lattice');
  if (view === 'lattice') {
    rebuildLattice();
    frameLattice();
  } else {
    rebuildSingle();
    controls.target.set(0, 0.4, 0);
    camera.position.set(4.5, 5.2, 7.5);
  }
}

function selectBeat(i) {
  state.selected = Math.max(0, Math.min(state.progression.length - 1, i));
  paintBeatStrip();
  if (state.view === 'single') rebuildSingle();
  if (explore.open) {
    document.getElementById('exBeat').textContent = currentChord().symbol;
    computeSuggestions();
  }
}

// ---------------------------------------------------------------------------
// Pointer interaction
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -G.TOP_Y);
const hit = new THREE.Vector3();
let active = null;

function setPointer(e) {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
}
function nearestPcTo(posVec) {
  let best = null,
    bestD = Infinity;
  for (let pc = 0; pc < 12; pc++) {
    const { x, z } = G.chromaXZ(pc);
    const d = (posVec.x - x) ** 2 + (posVec.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = pc;
    }
  }
  return best;
}

let downX = 0,
  downY = 0,
  downHadPeg = false;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (state.view === 'single') {
    const targets = [];
    if (state.voices.melody) targets.push(pegs.melody.mesh);
    if (state.voices.counter) targets.push(pegs.counter.mesh);
    const inter = raycaster.intersectObjects(targets, true);
    if (inter.length) {
      let obj = inter[0].object;
      while (obj && !obj.userData.kind) obj = obj.parent;
      active = obj.userData.kind;
      controls.enabled = false;
    }
  }
  downHadPeg = active !== null;
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!active) {
    // explorer ghost hover (single view): hover a ghost to audition that option
    if (explore.open && state.view === 'single' && ghostGroup.children.length) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const inter = raycaster.intersectObject(ghostGroup, true);
      if (inter.length) {
        let obj = inter[0].object;
        while (obj && obj.userData.exIndex == null) obj = obj.parent;
        if (obj) hoverSuggestion(obj.userData.exIndex);
      }
    }
    return;
  }
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(dragPlane, hit)) {
    const peg = pegs[active];
    const r = Math.hypot(hit.x, hit.z);
    const maxR = G.SOCK_RING_R + 1.6;
    if (r > maxR) {
      hit.x *= maxR / r;
      hit.z *= maxR / r;
    }
    peg.pos.set(hit.x, G.TOP_Y, hit.z);
    setPegPitch(active, nearestPcTo(peg.pos));
  }
});

function endDrag() {
  if (active) {
    active = null;
    controls.enabled = true;
  }
}
renderer.domElement.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  const wasDragging = active !== null;
  endDrag();
  if (downHadPeg || moved >= 5) return; // a drag/orbit, not a click
  // click: commit a ghost (explorer) / audition the solid (single) / select glyph (lattice)
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (state.view === 'single' && explore.open && ghostGroup.children.length) {
    const gi = raycaster.intersectObject(ghostGroup, true);
    if (gi.length) {
      let obj = gi[0].object;
      while (obj && obj.userData.exIndex == null) obj = obj.parent;
      if (obj) {
        commitSuggestion(obj.userData.exIndex);
        return;
      }
    }
  }
  if (state.view === 'single' && chordSolid && raycaster.intersectObject(chordSolid.group, true).length) {
    audition();
  } else if (state.view === 'lattice' && lattice) {
    for (const g of lattice.glyphs) {
      if (raycaster.intersectObject(g.group, true).length) {
        selectBeat(g.beat);
        audition();
        break;
      }
    }
  }
});
renderer.domElement.addEventListener('pointerleave', endDrag);

// ---------------------------------------------------------------------------
// Audio — synth spectrum IS the model spectrum (audio.js)
// ---------------------------------------------------------------------------
let audio = null;
let soundGlow = 0;
const muteState = { chord: false, melody: false, counter: false };
const gainState = { chord: 0.42, melody: 0.55, counter: 0.5 };

function getAudio() {
  if (!audio) {
    audio = new AudioEngine();
    for (const v of ['chord', 'melody', 'counter']) {
      audio.setMute(v, muteState[v]);
      audio.setLevel(v, gainState[v]);
    }
  }
  return audio;
}

// MIDIs that a given beat sounds, honouring which voices are active.
function beatMidis(i) {
  const b = state.progression[i];
  const out = { chord: b.chord.voicing };
  if (state.voices.melody && b.melodyPc != null) out.melody = G.melodyMidi(b.melodyPc, b.chord, state.octave);
  if (state.voices.counter && b.counterPc != null) out.counter = G.melodyMidi(b.counterPc, b.chord, state.octave);
  return out;
}

async function audition() {
  const eng = getAudio();
  await eng.start();
  eng.auditionBeat(beatMidis(state.selected), '2n');
  soundGlow = 1;
}

// ---------------------------------------------------------------------------
// Combinatorial explorer — rank melody/2nd-line choices for the selected beat
// ---------------------------------------------------------------------------
function noteName(midi) {
  return `${H.pcToName(midi % 12)}${Math.floor(midi / 12) - 1}`;
}

// Candidate pitches = all 12 pitch classes realised in the current register,
// exactly how a committed peg would sound, so committing reproduces the audition.
function candidateMidis(chord) {
  return Array.from({ length: 12 }, (_, pc) => G.melodyMidi(pc, chord, state.octave));
}

function prevMidisForExplore() {
  if (state.selected === 0) return null;
  const pb = state.progression[state.selected - 1];
  return {
    melody: pb.melodyPc != null ? G.melodyMidi(pb.melodyPc, pb.chord, state.octave) : null,
    counter: pb.counterPc != null ? G.melodyMidi(pb.counterPc, pb.chord, state.octave) : null,
  };
}

async function auditionSuggestion(s) {
  const eng = getAudio();
  await eng.start();
  eng.auditionBeat({ chord: currentChord().voicing, melody: s.melody, counter: s.counter ?? undefined }, '2n');
  soundGlow = 1;
}

function computeSuggestions() {
  const chord = currentChord();
  const cands = candidateMidis(chord);
  const beat = selectedBeat();
  const prev = prevMidisForExplore();
  const weights = {
    roughness: explore.weights.roughness,
    voiceLeading: explore.weights.voiceLeading,
    parallel: explore.parallelOn ? explore.weights.parallel : 0,
  };

  if (beat.melodyPc != null && explore.withCounter) {
    // SECOND-LINE mode: the melody is committed, rank the 2nd line against it.
    // This is where the parallel-5ths penalty bites (a fixed moving melody forces
    // the counter to either avoid or fall into parallels) — acceptance test 4.
    explore.mode = 'counter';
    const melMid = melMidi(beat.melodyPc);
    explore.suggestions = Ex.rankBeat({
      chordVoicing: chord.voicing,
      melodyCandidates: [melMid],
      counterCandidates: cands.filter((c) => c !== melMid),
      prev,
      weights,
      topN: explore.topN,
    });
  } else {
    // MELODY mode: suggest a melody (and optional 2nd line) for an empty beat.
    explore.mode = 'melody';
    explore.suggestions = Ex.rankBeat({
      chordVoicing: chord.voicing,
      melodyCandidates: cands,
      counterCandidates: explore.withCounter ? cands : null,
      prev,
      weights,
      topN: explore.topN,
    });
  }
  document.getElementById('exMode').textContent = explore.mode === 'counter' ? '2nd line' : 'melody';
  renderSuggestionList();
  buildGhosts();
}

function renderSuggestionList() {
  const list = document.getElementById('exList');
  list.innerHTML = '';
  const useCounter = explore.mode === 'counter';
  explore.suggestions.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'exrow' + (s.parallel ? ' parallel' : '');
    row.dataset.ex = i;
    const pitches = useCounter
      ? `${noteName(s.counter)} <small>2nd line</small>`
      : `${noteName(s.melody)}${s.counter != null ? ` <small>+ ${noteName(s.counter)}</small>` : ''}`;
    const flag = s.parallel ? '<span class="flag">∥5/8</span>' : '';
    row.innerHTML = `<span class="rk">${i + 1}</span><span class="pitches">${pitches} ${flag}</span><span class="cost">cost ${s.cost.toFixed(2)}<br>rgh ${s.rough.toFixed(2)}</span>`;
    row.addEventListener('mouseenter', () => hoverSuggestion(i));
    row.addEventListener('click', () => commitSuggestion(i));
    list.appendChild(row);
  });
}

function buildGhostPeg(pc, fit, kind = 'melody') {
  const g = G.buildPeg(kind);
  G.tintPeg(g, pc, fit);
  g.traverse((o) => {
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.34;
        m.depthWrite = false;
      });
    }
  });
  return g;
}

function buildGhosts() {
  clearGroup(ghostGroup);
  if (!explore.open || state.view !== 'single') return;
  const useCounter = explore.mode === 'counter';
  // one ghost per pitch class of the voice being suggested (best-ranked per pc)
  const bestPerPc = new Map();
  explore.suggestions.forEach((s, i) => {
    const midi = useCounter ? s.counter : s.melody;
    if (midi == null) return;
    const pc = midi % 12;
    if (!bestPerPc.has(pc)) bestPerPc.set(pc, i);
  });
  for (const [pc, i] of bestPerPc) {
    const s = explore.suggestions[i];
    const midi = useCounter ? s.counter : s.melody;
    const fit = H.fitRoughness(midi, currentChord().voicing);
    const ghost = buildGhostPeg(pc, fit, useCounter ? 'counter' : 'melody');
    const { x, z } = G.chromaXZ(pc);
    const baseY = pegBottomY(H.seatDepth(fit)); // computed once, here — not per frame
    ghost.position.set(x, baseY, z);
    ghost.userData.exIndex = i;
    ghost.userData.baseY = baseY;
    ghostGroup.add(ghost);
  }
}

function hoverSuggestion(i) {
  if (i === explore.hover) return;
  explore.hover = i;
  document.querySelectorAll('.exrow').forEach((r) => r.classList.toggle('hot', +r.dataset.ex === i));
  // raise the matching ghost a touch + audition
  ghostGroup.children.forEach((g) => (g.userData.hot = g.userData.exIndex === i));
  if (i >= 0 && explore.suggestions[i]) auditionSuggestion(explore.suggestions[i]);
}

function commitSuggestion(i) {
  const s = explore.suggestions[i];
  if (!s) return;
  const beat = selectedBeat();
  if (explore.mode === 'counter') {
    beat.counterPc = s.counter % 12; // melody stays; we chose a 2nd line
    state.voices.counter = true;
    document.getElementById('toggleCounter').classList.add('on');
  } else {
    beat.melodyPc = s.melody % 12;
    state.voices.melody = true;
    document.getElementById('toggleMelody').classList.add('on');
    if (s.counter != null) {
      beat.counterPc = s.counter % 12;
      state.voices.counter = true;
      document.getElementById('toggleCounter').classList.add('on');
    }
  }
  rebuildSingle();
  computeSuggestions(); // re-rank now that this beat is committed (affects neighbours)
  soundGlow = 1;
}

function setExplorerOpen(open) {
  explore.open = open;
  document.getElementById('explore').style.display = open ? 'block' : 'none';
  document.getElementById('exploreBtn').classList.toggle('on', open);
  document.querySelector('.legend').style.display = open ? 'none' : 'flex';
  if (open) {
    document.getElementById('exBeat').textContent = currentChord().symbol;
    if (state.view !== 'single') setView('single');
    computeSuggestions();
  } else {
    clearGroup(ghostGroup);
  }
}

// ---------------------------------------------------------------------------
// Transport — Tone.Sequence over beat indices
// ---------------------------------------------------------------------------
let sequence = null;

async function play() {
  const eng = getAudio();
  await eng.start();
  const Tone = eng.Tone;
  Tone.Transport.bpm.value = state.tempo;
  if (sequence) {
    sequence.dispose();
    sequence = null;
  }
  // The sequence schedules AUDIO only. The visual playhead is derived from the
  // Transport clock in tick() — robust, and decoupled from Tone.Draw (whose rAF
  // callbacks proved unreliable in headless render contexts).
  const idx = state.progression.map((_, i) => i);
  sequence = new Tone.Sequence((time, i) => eng.auditionBeat(beatMidis(i), '2n', time), idx, '2n');
  sequence.loop = state.loop;
  sequence.start(0);
  Tone.Transport.position = 0;
  Tone.Transport.start();
  state.playing = true;
  document.getElementById('playBtn').textContent = '■ Stop';
  document.getElementById('playBtn').classList.add('on');
}

function stop() {
  if (audio) {
    audio.Tone.Transport.stop();
    if (sequence) {
      sequence.dispose();
      sequence = null;
    }
  }
  state.playing = false;
  state.playhead = -1;
  paintBeatStrip();
  document.getElementById('playBtn').textContent = '▶ Play';
  document.getElementById('playBtn').classList.remove('on');
}

// ---------------------------------------------------------------------------
// Per-frame
// ---------------------------------------------------------------------------
function pegBottomY(seat) {
  if (seat >= 0) return G.TOP_Y - seat * G.SOCK_DEPTH;
  return G.TOP_Y + (-seat / 0.18) * G.REFUSE_LIFT;
}

let tPrev = 0;
function tick(tMs) {
  const t = tMs / 1000;
  const dt = Math.min(0.05, t - tPrev);
  tPrev = t;

  // playhead derived from the Transport clock (authoritative; no Tone.Draw)
  if (state.playing && audio) {
    const step = 120 / state.tempo; // seconds per '2n' beat
    const n = state.progression.length;
    const raw = Math.floor(audio.Tone.Transport.seconds / step + 1e-4);
    if (!state.loop && raw >= n) {
      stop();
    } else {
      const beat = ((raw % n) + n) % n;
      if (beat !== state.playhead) {
        state.playhead = beat;
        soundGlow = 1;
        paintBeatStrip();
      }
    }
  }

  if (state.view === 'single') {
    for (const which of ['melody', 'counter']) {
      const peg = pegs[which];
      const mesh = peg.mesh;
      mesh.visible = state.voices[which] && peg.pc != null;
      if (!mesh.visible) continue;
      const socket = peg.pc == null ? null : G.chromaXZ(peg.pc);
      let approach = 0;
      if (socket) {
        const hd = Math.hypot(peg.pos.x - socket.x, peg.pos.z - socket.z);
        approach = Math.max(0, Math.min(1, 1 - hd / 0.9));
      }
      peg.approach = approach;
      let tx = peg.pos.x,
        tz = peg.pos.z;
      if (socket) {
        tx = THREE.MathUtils.lerp(peg.pos.x, socket.x, approach);
        tz = THREE.MathUtils.lerp(peg.pos.z, socket.z, approach);
      }
      const effSeat = peg.seat * approach;
      const targetY = pegBottomY(effSeat) + (1 - approach) * HOVER;
      const strain = Math.max(0, peg.fit - H.SEAT.REFUSE) + Math.max(0, -peg.seat);
      const rattle = strain > 0 ? Math.sin(t * 38) * 0.05 * Math.min(1, strain * 3) : 0;
      mesh.position.x += (tx + rattle - mesh.position.x) * Math.min(1, dt * 14);
      mesh.position.z += (tz - mesh.position.z) * Math.min(1, dt * 14);
      mesh.position.y += (targetY - mesh.position.y) * Math.min(1, dt * 12);
      if (chordSolid && socket && approach > 0.4) {
        const s = chordSolid.sockets[peg.pc];
        const pulse = 0.6 + 0.4 * Math.sin(t * 4);
        s.ring.material.emissiveIntensity = 0.2 + 0.8 * approach * pulse;
      }
    }
    // ghost pegs: gently bob, the hovered one lifts (baseY precomputed at build)
    for (const g of ghostGroup.children) {
      const lift = g.userData.hot ? 0.5 : 0;
      const target = g.userData.baseY + lift + Math.sin(t * 2 + g.userData.exIndex) * 0.04;
      g.position.y += (target - g.position.y) * Math.min(1, dt * 8);
    }
  }

  // sounding glow
  if (soundGlow > 0) {
    soundGlow = Math.max(0, soundGlow - dt * 0.9);
    if (state.view === 'single' && chordSolid) {
      chordSolid.bodyMat.emissiveIntensity = chordSolid.baseEmissive + soundGlow * 0.9;
      for (const which of ['melody', 'counter'])
        if (state.voices[which] && pegs[which].pc != null) pegs[which].mesh.userData.cap.material.emissiveIntensity = 0.3 + soundGlow * 1.2;
    }
  }

  // lattice: highlight playing / selected glyphs; optional camera follow
  if (state.view === 'lattice' && lattice) {
    for (const g of lattice.glyphs) {
      const ud = g.group.userData;
      let target = ud.baseEmissive;
      if (g.beat === state.playhead) target = ud.baseEmissive + 1.2 * soundGlow + 0.3;
      else if (g.beat === state.selected) target = ud.baseEmissive + 0.35;
      ud.bodyMat.emissiveIntensity += (target - ud.bodyMat.emissiveIntensity) * Math.min(1, dt * 8);
      const s = g.beat === state.playhead ? 1.12 : 1;
      g.group.scale.x += (s - g.group.scale.x) * Math.min(1, dt * 8);
      g.group.scale.y = g.group.scale.z = g.group.scale.x;
    }
    if (state.follow && state.playing && state.playhead >= 0) {
      controls.target.lerp(lattice.pos[state.playhead], Math.min(1, dt * 2.5));
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Readout
// ---------------------------------------------------------------------------
function seatStateLabel(seat, fit) {
  if (fit <= H.SEAT.FLUSH) return ['seats flush', 'var(--good)'];
  if (seat > 0) return ['partial seat — honest gap', 'var(--warn)'];
  return ['refuses to seat', 'var(--bad)'];
}
function updateReadout() {
  const peg = pegs.melody;
  const $ = (id) => document.getElementById(id);
  if (peg.pc == null) {
    $('roPitch').textContent = '—';
    $('roState').textContent = 'drag a peg onto the chord';
    $('roState').style.color = 'var(--ink-dim)';
    $('roBar').style.width = '0%';
    return;
  }
  const midi = melMidi(peg.pc);
  const noteOct = Math.floor(midi / 12) - 1;
  $('roPitch').textContent = `${H.pcToName(midi % 12)}${noteOct}`;
  const [label, col] = seatStateLabel(peg.seat, peg.fit);
  const st = $('roState');
  st.textContent = label;
  st.style.color = col;
  $('roFit').textContent = peg.fit.toFixed(3);
  $('roSeat').textContent = Math.max(0, peg.seat).toFixed(2) + (peg.seat < 0 ? ' (repelled)' : '');
  $('roSon').textContent = H.roughness([...chordMidis(), midi]).normalized.toFixed(3);
  $('roIcv').textContent = `[${H.intervalClassVector([...currentChord().pcs, peg.pc]).join(' ')}]`;
  const bar = $('roBar');
  bar.style.width = Math.min(100, peg.fit * 100) + '%';
  bar.style.background = peg.fit <= H.SEAT.FLUSH ? 'var(--good)' : peg.seat > 0 ? 'var(--warn)' : 'var(--bad)';
}

// ---------------------------------------------------------------------------
// Beat strip
// ---------------------------------------------------------------------------
function paintBeatStrip() {
  const strip = document.getElementById('beatStrip');
  strip.innerHTML = '';
  state.progression.forEach((b, i) => {
    const chip = document.createElement('div');
    chip.className = 'beatchip' + (i === state.selected ? ' sel' : '') + (i === state.playhead ? ' playing' : '');
    const next = state.progression[i + 1];
    const vl = next ? H.voiceLeading(b.chord.pcs, next.chord.pcs).distance : null;
    chip.innerHTML = `${b.chord.symbol}` + (vl != null ? `<small>${vl}→</small>` : '<small>·</small>');
    chip.title = vl != null ? `${b.chord.symbol} → ${next.chord.symbol}: voice-leading ${vl} semitones` : b.chord.symbol;
    chip.addEventListener('click', () => selectBeat(i));
    strip.appendChild(chip);
  });
}

// ---------------------------------------------------------------------------
// Controls wiring
// ---------------------------------------------------------------------------
const chordInput = document.getElementById('chordInput');
chordInput.addEventListener('input', () => {
  try {
    const beats = chordInput.value.trim().split(/\s+/).filter(Boolean).map(makeBeat);
    if (!beats.length) throw new Error('empty');
    state.progression = beats;
    state.selected = Math.min(state.selected, beats.length - 1);
    chordInput.classList.remove('bad');
    paintBeatStrip();
    if (state.view === 'single') rebuildSingle();
    else {
      rebuildLattice();
      frameLattice();
    }
    refreshExplorerIfOpen();
  } catch (err) {
    chordInput.classList.add('bad');
  }
});

document.getElementById('viewSingle').addEventListener('click', () => setView('single'));
document.getElementById('viewLattice').addEventListener('click', () => setView('lattice'));

const octaveRow = document.getElementById('octaveRow');
[
  { oct: 4, label: 'low' },
  { oct: 5, label: 'mid' },
  { oct: 6, label: 'high' },
].forEach(({ oct, label }) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'background:#11151e;border:1px solid var(--panel-border);color:var(--ink);border-radius:7px;padding:6px 8px;cursor:pointer;';
  if (oct === state.octave) {
    b.style.background = 'var(--accent)';
    b.style.color = '#0a0c11';
  }
  b.addEventListener('click', () => {
    state.octave = oct;
    [...octaveRow.children].forEach((c) => {
      c.style.background = '#11151e';
      c.style.color = 'var(--ink)';
    });
    b.style.background = 'var(--accent)';
    b.style.color = '#0a0c11';
    if (state.view === 'single') rebuildSingle();
    refreshExplorerIfOpen();
  });
  octaveRow.appendChild(b);
});

function wireToggle(id, voice) {
  document.getElementById(id).addEventListener('click', (e) => {
    state.voices[voice] = !state.voices[voice];
    e.currentTarget.classList.toggle('on', state.voices[voice]);
    if (state.voices[voice] && pegs[voice].pc == null && state.view === 'single') {
      const startPc = voice === 'melody' ? currentChord().rootPc : currentChord().pcs[Math.min(2, currentChord().pcs.length - 1)];
      const { x, z } = G.chromaXZ(startPc);
      pegs[voice].pos.set(x, G.TOP_Y, z);
      pegs[voice].mesh.position.set(x, G.TOP_Y + HOVER, z);
      setPegPitch(voice, startPc);
    }
    if (!state.voices[voice]) selectedBeat()[voice === 'melody' ? 'melodyPc' : 'counterPc'] = null;
  });
}
wireToggle('toggleMelody', 'melody');
wireToggle('toggleCounter', 'counter');

document.getElementById('auditionBtn').addEventListener('click', audition);
document.querySelectorAll('.seg.mute').forEach((btn) => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.voice;
    const on = btn.classList.toggle('on');
    muteState[v] = !on;
    if (audio) audio.setMute(v, muteState[v]);
  });
});
document.querySelectorAll('input.gain').forEach((sl) => {
  sl.addEventListener('input', () => {
    const v = sl.dataset.voice;
    gainState[v] = +sl.value;
    if (audio) audio.setLevel(v, gainState[v]);
  });
});

// explorer controls
function refreshExplorerIfOpen() {
  if (!explore.open) return;
  document.getElementById('exBeat').textContent = currentChord().symbol;
  computeSuggestions();
}
document.getElementById('exploreBtn').addEventListener('click', () => setExplorerOpen(!explore.open));
document.getElementById('exClose').addEventListener('click', () => setExplorerOpen(false));
document.getElementById('exCounter').addEventListener('click', (e) => {
  explore.withCounter = !explore.withCounter;
  e.currentTarget.classList.toggle('on', explore.withCounter);
  refreshExplorerIfOpen();
});
document.getElementById('exTopN').addEventListener('change', (e) => {
  explore.topN = +e.target.value;
  refreshExplorerIfOpen();
});
const wParToggle = document.getElementById('wParToggle');
wParToggle.addEventListener('click', () => {
  explore.parallelOn = !explore.parallelOn;
  wParToggle.classList.toggle('on', explore.parallelOn);
  wParToggle.textContent = explore.parallelOn ? 'on' : 'off';
  refreshExplorerIfOpen();
});
[
  ['wRough', 'roughness', 'wRoughV'],
  ['wVL', 'voiceLeading', 'wVLV'],
  ['wPar', 'parallel', null],
].forEach(([id, key, valId]) => {
  document.getElementById(id).addEventListener('input', (e) => {
    explore.weights[key] = +e.target.value;
    if (valId) document.getElementById(valId).textContent = (+e.target.value).toFixed(1);
    refreshExplorerIfOpen();
  });
});

document.getElementById('playBtn').addEventListener('click', () => (state.playing ? stop() : play()));
const loopBtn = document.getElementById('loopBtn');
loopBtn.addEventListener('click', () => {
  state.loop = !state.loop;
  loopBtn.classList.toggle('on', state.loop);
  if (sequence) sequence.loop = state.loop;
});
const followBtn = document.getElementById('followBtn');
followBtn.addEventListener('click', () => {
  state.follow = !state.follow;
  followBtn.classList.toggle('on', state.follow);
});
const tempo = document.getElementById('tempo');
tempo.addEventListener('input', () => {
  state.tempo = +tempo.value;
  document.getElementById('tempoVal').textContent = tempo.value;
  if (audio) audio.Tone.Transport.bpm.value = state.tempo;
});

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    audition();
  }
});

// ---------------------------------------------------------------------------
// Acceptance-test debug panel (runs the MODEL live, in the browser)
// ---------------------------------------------------------------------------
function runAcceptanceTests() {
  const tests = [];
  const Cmaj = [60, 64, 67];
  const sd = (m, ctx) => H.seatDepth(H.fitRoughness(m, ctx));

  const c5 = sd(72, Cmaj),
    g5 = sd(79, Cmaj),
    b4 = sd(71, Cmaj),
    db4 = sd(61, Cmaj);
  tests.push({
    name: '1 · C5/G5 seat flush, B4 partial, Db4 refuses',
    pass: c5 >= 0.999 && g5 >= 0.999 && b4 > 0 && b4 < 0.999 && db4 <= 0,
    detail: `C5=${c5.toFixed(2)} G5=${g5.toFixed(2)} B4=${b4.toFixed(2)} Db4=${db4.toFixed(2)}`,
  });

  const icvSame = JSON.stringify(H.intervalClassVector([0, 4, 7])) === JSON.stringify(H.intervalClassVector([1, 5, 8]));
  const vlSame = H.voiceLeading([2, 5, 9, 0], [7, 11, 2, 5]).distance === H.voiceLeading([3, 6, 10, 1], [8, 0, 3, 6]).distance;
  const fb = H.fitRoughness(71, Cmaj),
    fa = H.fitRoughness(72, Cmaj.map((x) => x + 1));
  const resid = Math.abs(fa - fb) / fb;
  tests.push({
    name: '2 · transpose: ICV & VL exact, fit residual < 5%',
    pass: icvSame && vlSame && resid < 0.05,
    detail: `ICV=${icvSame} VL=${vlSame} fitΔ=${(resid * 100).toFixed(1)}%`,
  });

  const vlG7 = H.voiceLeading([2, 5, 9, 0], [7, 11, 2, 5]);
  const vlF7 = H.voiceLeading([2, 5, 9, 0], H.parseChord('F#maj7').pcs);
  tests.push({
    name: '3 · Dm7→G7 closer than Dm7→F#maj7',
    pass: vlG7.distance === 3 && vlG7.distance < vlF7.distance,
    detail: `Dm7→G7=${vlG7.distance} (${vlG7.assignment.map((p) => `${H.pcToName(p.from)}→${H.pcToName(p.to)}`).join(',')})  Dm7→F#maj7=${vlF7.distance}`,
  });

  // 4 — toggling the parallel-5ths penalty reorders the 2nd-line suggestions.
  // Setup: previous beat is a C5/G5 perfect fifth; the melody moves C5→D5, so the
  // counter A5 makes textbook parallel fifths. With the penalty on it must fall.
  const Gtri = [55, 59, 62];
  const prevP5 = { melody: 72, counter: 79 }; // C5 / G5
  const melFixed = [74]; // D5
  const counters = [72, 73, 75, 76, 77, 79, 81, 83]; // incl. A5=81 (the parallel one)
  const rOff = Ex.rankBeat({ chordVoicing: Gtri, melodyCandidates: melFixed, counterCandidates: counters, prev: prevP5, weights: { roughness: 1, voiceLeading: 0.6, parallel: 0 }, topN: counters.length });
  const rOn = Ex.rankBeat({ chordVoicing: Gtri, melodyCandidates: melFixed, counterCandidates: counters, prev: prevP5, weights: { roughness: 1, voiceLeading: 0.6, parallel: 0.8 }, topN: counters.length });
  const rankA = (list) => list.findIndex((x) => x.counter === 81);
  const reordered = JSON.stringify(rOff.map((x) => x.counter)) !== JSON.stringify(rOn.map((x) => x.counter));
  tests.push({
    name: '4 · parallel-5ths penalty reorders 2nd-line picks',
    pass: reordered && rankA(rOn) > rankA(rOff) && rOn.find((x) => x.counter === 81).parallel,
    detail: `A5 (∥5th) rank: off=${rankA(rOff)} → on=${rankA(rOn)} of ${counters.length}`,
  });

  const cand = [0, 2, 4, 5, 7, 9, 11, 1, 6].map((pc) => {
    const midi = 72 + (((pc % 12) + 12) % 12);
    return { seat: H.seatDepth(H.fitRoughness(midi, Cmaj)), rough: H.roughness([...Cmaj, midi]).normalized };
  });
  let disagree = 0;
  for (let i = 0; i < cand.length; i++)
    for (let j = i + 1; j < cand.length; j++) {
      const ds = Math.sign(cand[i].seat - cand[j].seat),
        dr = Math.sign(cand[i].rough - cand[j].rough);
      if (ds !== 0 && dr !== 0 && ds === dr) disagree++;
    }
  tests.push({
    name: '5 · eye (seat) and ear (roughness) never disagree',
    pass: disagree === 0,
    detail: `${cand.length} candidate pegs, ${disagree} eye/ear disagreements · synth spectrum = model spectrum`,
  });

  const list = document.getElementById('debugList');
  list.innerHTML = '';
  let p = 0,
    f = 0;
  for (const t of tests) {
    const row = document.createElement('div');
    row.className = 't';
    const mark = t.pass === null ? '·' : t.pass ? '✓' : '✗';
    const cls = t.pass === null ? '' : t.pass ? 'pass' : 'fail';
    if (t.pass === true) p++;
    if (t.pass === false) f++;
    row.innerHTML = `<span class="mark ${cls}">${mark}</span><span><span class="${cls}">${t.name}</span><br><span class="num">${t.detail}</span></span>`;
    list.appendChild(row);
  }
  document.getElementById('debugSum').textContent = `${p}/${p + f} pass`;
}

// ---------------------------------------------------------------------------
// Resize + boot
// ---------------------------------------------------------------------------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Onboarding overlay dismissal is wired inline in index.html (so it works even
// before this module / the CDN libraries finish loading). Nothing to do here.

paintBeatStrip();
rebuildSingle();
// start the melody peg seated on the chord root so the mapping is visible on load
{
  const startPc = currentChord().rootPc;
  const { x, z } = G.chromaXZ(startPc);
  pegs.melody.pos.set(x, G.TOP_Y, z);
  pegs.melody.mesh.position.set(x, G.TOP_Y, z);
  setPegPitch('melody', startPc);
}
runAcceptanceTests();
requestAnimationFrame(tick);

// Debug handle for tests / console (no musical logic here).
window.HS = {
  state,
  pegs,
  H,
  G,
  L,
  setView,
  selectBeat,
  setPegPitch,
  rebuildSingle,
  rebuildLattice,
  audition,
  play,
  stop,
  getAudio,
  beatMidis,
  paintBeatStrip,
  Ex,
  explore,
  setExplorerOpen,
  computeSuggestions,
  commitSuggestion,
  hoverSuggestion,
  dropPeg(which, pc) {
    const { x, z } = G.chromaXZ(pc);
    pegs[which].pos.set(x, G.TOP_Y, z);
    setPegPitch(which, pc);
    return { pc, fit: pegs[which].fit, seat: pegs[which].seat };
  },
  readout() {
    return {
      pitch: document.getElementById('roPitch').textContent,
      state: document.getElementById('roState').textContent,
      fit: document.getElementById('roFit').textContent,
      seat: document.getElementById('roSeat').textContent,
    };
  },
};
