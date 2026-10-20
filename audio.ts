// Procedural Web Audio Sound Synthesizer for Shadow Strike: Survival
// Zero external files - synthesizes realistic tactical military sound effects

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmOsc1: OscillatorNode | null = null;
  private bgmOsc2: OscillatorNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private isBgmPlaying: boolean = false;

  public masterVolume: number = 0.8;
  public sfxVolume: number = 0.9;
  public musicVolume: number = 0.4;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;

    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : master;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    return this.isMuted;
  }

  // Tactical Assault Rifle Gunshot
  public playGunshot(isSilenced = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Noise transient for bullet crack
    const bufferSize = this.ctx.sampleRate * (isSilenced ? 0.08 : 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = isSilenced ? 'bandpass' : 'lowpass';
    noiseFilter.frequency.setValueAtTime(isSilenced ? 1400 : 3800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.14);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isSilenced ? 0.4 : 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSource.start(now);

    // 2. Low end punch / chamber recoil boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isSilenced ? 110 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    oscGain.gain.setValueAtTime(isSilenced ? 0.3 : 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Enemy Firing
  public playEnemyGunshot() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Tactical ADS Zoom sound
  public playAimIn() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Hit Marker Tick
  public playHitMarker() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1600, now + 0.03);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Reload Mag Out and Mag In
  public playReload() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Mag out click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(320, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Mag in click & bolt release at 0.5s
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(580, now + 0.55);
    osc2.frequency.setValueAtTime(740, now + 0.62);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.35, now + 0.55);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.55);
    osc2.stop(now + 0.78);
  }

  // Footstep Sound
  public playFootstep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Jump sound
  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Player Damage Groan / Impact
  public playPlayerHurt() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Enemy Down / Eliminate
  public playEnemyDown() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Pickup ammo or medkit
  public playPickup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.06);
    osc.frequency.setValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Victory Fanfare
  public playVictory() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.35, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.5);
    });
  }

  // Ambient Tactical Tension Drone
  public startCombatBGM() {
    this.init();
    if (this.isBgmPlaying || !this.ctx || !this.musicGain) return;

    try {
      this.isBgmPlaying = true;
      const now = this.ctx.currentTime;

      this.bgmOsc1 = this.ctx.createOscillator();
      this.bgmOsc2 = this.ctx.createOscillator();
      this.bgmFilter = this.ctx.createBiquadFilter();

      this.bgmOsc1.type = 'sawtooth';
      this.bgmOsc1.frequency.setValueAtTime(55, now); // A1 note

      this.bgmOsc2.type = 'triangle';
      this.bgmOsc2.frequency.setValueAtTime(82.4, now); // E2 note

      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.setValueAtTime(280, now);

      this.bgmOsc1.connect(this.bgmFilter);
      this.bgmOsc2.connect(this.bgmFilter);
      this.bgmFilter.connect(this.musicGain);

      this.bgmOsc1.start();
      this.bgmOsc2.start();
    } catch {
      // Audio context might be waiting for user touch
    }
  }

  public stopCombatBGM() {
    if (!this.isBgmPlaying) return;
    try {
      this.bgmOsc1?.stop();
      this.bgmOsc2?.stop();
      this.bgmOsc1?.disconnect();
      this.bgmOsc2?.disconnect();
      this.bgmFilter?.disconnect();
    } catch {}
    this.bgmOsc1 = null;
    this.bgmOsc2 = null;
    this.bgmFilter = null;
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundEngine();
