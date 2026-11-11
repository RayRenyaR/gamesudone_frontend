// ============================================================================
// CONFIGURACIÓN DE MÚSICA Y SONIDOS DE INTERFAZ (EDITABLE)
// Coloca tus archivos en public/assets/music/ y cambia las URLs aquí:
// ============================================================================

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const PLAYLIST_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Cyber Plaza Y2K',
    artist: 'gamesUDONE OST',
    // Puedes reemplazar por '/assets/music/tu_cancion_1.mp3'
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
  },
  {
    id: 'track-2',
    title: 'Neon Channel Menu',
    artist: 'Console Dreams',
    // Puedes reemplazar por '/assets/music/tu_cancion_2.mp3'
    url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
  },
  {
    id: 'track-3',
    title: 'StarlightLobby 2004',
    artist: 'Retro Wave UDO',
    // Puedes reemplazar por '/assets/music/tu_cancion_3.mp3'
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/ateapill.ogg',
  },
];

// Si deseas usar archivos .mp3/.wav propios para la interfaz, coloca la ruta aquí.
// Si se deja vacío (''), usa el sintetizador retro integrado sin requerir descargas.
export const CUSTOM_SFX_URLS = {
  click: './assets/sfx/click.wav', // ej: '/assets/sfx/click.mp3'
  hover: './assets/sfx/hover.wav', // ej: '/assets/sfx/hover.mp3'
  open: './assets/sfx/open.wav',  // ej: '/assets/sfx/open.mp3'
  close: './assets/sfx/close.wav', // ej: '/assets/sfx/close.mp3'
};

class SoundController {
  private audioCtx: AudioContext | null = null;
  public sfxEnabled: boolean = localStorage.getItem('udo_sfx_enabled') !== 'false';

  private getContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    localStorage.setItem('udo_sfx_enabled', String(enabled));
  }

  private playTone(freq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignorar si el navegador bloquea autoplay antes del primer clic
    }
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    if (CUSTOM_SFX_URLS.click) {
      new Audio(CUSTOM_SFX_URLS.click).play().catch(() => {});
      return;
    }
    this.playTone(520, 780, 0.075, 'triangle', 0.09);
  }

  public playHover() {
    if (!this.sfxEnabled) return;
    if (CUSTOM_SFX_URLS.hover) {
      new Audio(CUSTOM_SFX_URLS.hover).play().catch(() => {});
      return;
    }
    this.playTone(340, 410, 0.04, 'sine', 0.035);
  }

  public playOpen() {
    if (!this.sfxEnabled) return;
    if (CUSTOM_SFX_URLS.open) {
      new Audio(CUSTOM_SFX_URLS.open).play().catch(() => {});
      return;
    }
    this.playTone(380, 860, 0.14, 'sine', 0.09);
  }

  public playClose() {
    if (!this.sfxEnabled) return;
    if (CUSTOM_SFX_URLS.close) {
      new Audio(CUSTOM_SFX_URLS.close).play().catch(() => {});
      return;
    }
    this.playTone(680, 290, 0.12, 'sine', 0.08);
  }
}

export const soundManager = new SoundController();