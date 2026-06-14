// =============================================================================
// audio.js — Tone.js playback whose SPECTRUM IS THE MODEL'S SPECTRUM.
//
// Each voice is an additive synth with exactly the 6 sawtooth-weighted partials
// (a_k = 1/k) that harmony.js sums the Plomp-Levelt curve over. No filters, no
// extra oscillators, nothing that would reshape the spectrum — so the roughness
// the listener HEARS is the roughness the geometry was BUILT from. That identity
// is the whole point of the brief; do not add tone-shaping here.
//
// Tone.js is loaded as a global from CDN (window.Tone).
// =============================================================================

import { SAW_PARTIALS } from './harmony.js';

const VOICE_DEFAULTS = { chord: 0.42, melody: 0.55, counter: 0.5 };

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.Tone = window.Tone;
    this.master = new this.Tone.Gain(0.85).toDestination();
    // a touch of room so sustained chords aren't sterile — reverb is applied
    // EQUALLY to every partial, so it does not change relative roughness.
    this.reverb = new this.Tone.Reverb({ decay: 1.6, wet: 0.16 }).connect(this.master);

    this.voices = {};
    for (const name of ['chord', 'melody', 'counter']) {
      const gain = new this.Tone.Gain(VOICE_DEFAULTS[name]).connect(this.reverb);
      const synth = new this.Tone.PolySynth(this.Tone.Synth, {
        maxPolyphony: 16,
        oscillator: { type: 'custom', partials: SAW_PARTIALS },
        envelope: { attack: 0.015, decay: 0.12, sustain: 0.75, release: 0.5 },
      }).connect(gain);
      this.voices[name] = { synth, gain, muted: false, level: VOICE_DEFAULTS[name] };
    }
  }

  async start() {
    if (this.ready) return;
    await this.Tone.start();
    this.ready = true;
  }

  midiToNote(m) {
    return this.Tone.Frequency(m, 'midi').toNote();
  }

  /** Trigger one voice's notes for a duration. midis = array of MIDI numbers. */
  trigger(name, midis, dur = '4n', time) {
    const v = this.voices[name];
    if (!v || v.muted || !midis || !midis.length) return;
    const notes = midis.map((m) => this.midiToNote(m));
    v.synth.triggerAttackRelease(notes, dur, time);
  }

  /** Audition a single beat: chord + (optional) melody + (optional) counter. */
  auditionBeat({ chord, melody, counter }, dur = '2n', time) {
    this.trigger('chord', chord, dur, time);
    if (melody != null) this.trigger('melody', [melody], dur, time);
    if (counter != null) this.trigger('counter', [counter], dur, time);
  }

  setMute(name, muted) {
    const v = this.voices[name];
    if (!v) return;
    v.muted = muted;
    v.gain.gain.rampTo(muted ? 0 : v.level, 0.04);
  }

  setLevel(name, level) {
    const v = this.voices[name];
    if (!v) return;
    v.level = level;
    if (!v.muted) v.gain.gain.rampTo(level, 0.04);
  }

  setMaster(level) {
    this.master.gain.rampTo(level, 0.04);
  }
}
