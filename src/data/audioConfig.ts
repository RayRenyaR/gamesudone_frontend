// ============================================================================
// CONFIGURACIÓN DE AUDIO DE GAMESUDONE (TEMA ÚNICO + SFX)
// Coloca tu canción en public/assets/music/tema-principal.mp3 y actualiza la ruta:
// ============================================================================

export const MAIN_THEME_URL =
  '/assets/audio/gamesUDONE-Theme.ogg';

// Si deseas usar archivos .mp3/.wav propios para la interfaz, coloca la ruta aquí.
// Si se deja vacío (''), usa el sintetizador retro integrado.
export const CUSTOM_SFX_URLS = {
  click: '',
  hover: '',
  open: '',
  close: '',
};

class SoundController {
  private audioCtx: AudioContext | null = null;
  public sfxEnabled: boolean = localStorage.getItem('udo_sfx_enabled') !== 'false';

  private getContext(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08
  ) {
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
      // Ignorar bloqueo de autoplay antes del primer clic
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