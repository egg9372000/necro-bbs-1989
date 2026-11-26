// Procedural Web Audio API synthesizer for 1989 DTMF dialing, V.22bis modem handshake & retro CRT SFX

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '0': [941, 1336],
};

class ModemAudioSynth {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'square',
    gainPeak = 0.05,
    startOffsetSec = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffsetSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playModemHandshake(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // 1. DTMF Touch-Tone sequence for "5551989"
    const digits = '5551989';
    let offset = 0;
    for (const d of digits) {
      const pair = DTMF_FREQS[d];
      if (pair) {
        this.playTone(pair[0], 0.075, 'sine', 0.045, offset);
        this.playTone(pair[1], 0.075, 'sine', 0.045, offset);
      }
      offset += 0.105;
    }

    // 2. 2100 Hz CED answer tone
    offset += 0.14;
    this.playTone(2100, 0.32, 'sine', 0.04, offset);

    // 3. V.22bis FSK carrier chirp + scrambled noise burst
    offset += 0.34;
    const chirpFreqs = [1200, 2400, 1650, 2225, 1800, 2400, 1300];
    for (const f of chirpFreqs) {
      this.playTone(f, 0.055, 'sawtooth', 0.03, offset);
      offset += 0.055;
    }

    // Brief filtered white-noise static hiss (classic modem train phase)
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.18;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    const noiseGain = ctx.createGain();
    const startAt = ctx.currentTime + offset;
    noiseGain.gain.setValueAtTime(0.045, startAt);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(startAt);
    noise.stop(startAt + 0.26);
  }

  public playKeyBeep(): void {
    this.playTone(880, 0.035, 'square', 0.025);
  }

  public playRelicChime(): void {
    this.playTone(660, 0.08, 'triangle', 0.05, 0);
    this.playTone(990, 0.12, 'triangle', 0.05, 0.07);
  }

  public playCombatHit(): void {
    this.playTone(190, 0.09, 'sawtooth', 0.055, 0);
  }

  public playStairsDescend(): void {
    this.playTone(523, 0.08, 'triangle', 0.05, 0);
    this.playTone(659, 0.08, 'triangle', 0.05, 0.08);
    this.playTone(784, 0.14, 'triangle', 0.05, 0.16);
  }
}

export const modemAudio = new ModemAudioSynth();
