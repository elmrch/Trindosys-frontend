import { Injectable } from '@angular/core';

/**
 * Genera un tono de notificación corto con la Web Audio API — sin depender
 * de ningún archivo de audio externo.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private audioContext: AudioContext | null = null;

  playNewMessageTone(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      this.playTone(ctx, 880, ctx.currentTime, 0.12, 0.08);
      this.playTone(ctx, 1318.5, ctx.currentTime + 0.09, 0.16, 0.09);
    } catch {
      // El navegador puede bloquear audio sin interacción previa del usuario; se ignora.
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, volume: number): void {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }
}
