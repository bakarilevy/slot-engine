import { EffectManager, EffectPriority, EffectConfig } from './EffectManager';
import { GCSprite } from '../types/GalaceanTypes';

/**
 * Convenience helpers for playing common slot machine effects
 */
export class Effects {
  private static effectManager = EffectManager.getInstance();

  /**
   * Play coin shower effect for big wins
   */
  static async playCoinShower(count: number = 50, duration: number = 3000): Promise<void> {
    await this.effectManager.createEffect({
      id: `coinShower_${Date.now()}`,
      type: 'coinShower',
      priority: EffectPriority.HIGH,
      duration,
      params: { count, duration }
    });
  }

  /**
   * Play gem explosion at specific position
   */
  static async playGemExplosion(x: number, y: number, particleCount: number = 30, duration: number = 1500): Promise<void> {
    await this.effectManager.createEffect({
      id: `gemExplosion_${Date.now()}`,
      type: 'gemExplosion',
      priority: EffectPriority.HIGH,
      duration,
      params: { x, y, particleCount, duration }
    });
  }

  /**
   * Play light beam rays for jackpot
   */
  static async playLightBeam(beamCount: number = 8, duration: number = 2000): Promise<void> {
    await this.effectManager.createEffect({
      id: `lightBeam_${Date.now()}`,
      type: 'lightBeam',
      priority: EffectPriority.CRITICAL,
      duration,
      params: { beamCount, duration }
    });
  }

  /**
   * Play confetti cascade
   */
  static async playConfetti(count: number = 100, duration: number = 3000): Promise<void> {
    await this.effectManager.createEffect({
      id: `confetti_${Date.now()}`,
      type: 'confetti',
      priority: EffectPriority.NORMAL,
      duration,
      params: { count, duration }
    });
  }

  /**
   * Play spin blur effect on reel
   */
  static async playSpinBlur(reelIndex: number, reelWidth: number = 100, reelHeight: number = 400, duration: number = 500): Promise<void> {
    await this.effectManager.createEffect({
      id: `spinBlur_${Date.now()}`,
      type: 'spinBlur',
      priority: EffectPriority.LOW,
      duration,
      params: { reelIndex, reelWidth, reelHeight, duration }
    });
  }

  /**
   * Play reel stop impact flash
   */
  static async playStopImpact(x: number, y: number, duration: number = 300): Promise<void> {
    await this.effectManager.createEffect({
      id: `stopImpact_${Date.now()}`,
      type: 'stopImpact',
      priority: EffectPriority.NORMAL,
      duration,
      params: { x, y, duration }
    });
  }

  /**
   * Play symbol glow/highlight for winning symbols
   */
  static async playSymbolGlow(symbols: GCSprite[], color: number = 0xffff00, duration: number = 2000): Promise<void> {
    await this.effectManager.createEffect({
      id: `symbolGlow_${Date.now()}`,
      type: 'symbolGlow',
      priority: EffectPriority.HIGH,
      duration,
      params: { symbols, color, duration }
    });
  }

  /**
   * Play button press ripple effect
   */
  static async playButtonRipple(x: number, y: number, duration: number = 400): Promise<void> {
    await this.effectManager.createEffect({
      id: `buttonRipple_${Date.now()}`,
      type: 'buttonRipple',
      priority: EffectPriority.LOW,
      duration,
      params: { x, y, duration }
    });
  }

  /**
   * Play balance count-up animation with particles
   */
  static async playBalanceCountUp(startValue: number, endValue: number, x: number, y: number, duration: number = 1500): Promise<void> {
    await this.effectManager.createEffect({
      id: `balanceCountUp_${Date.now()}`,
      type: 'balanceCountUp',
      priority: EffectPriority.NORMAL,
      duration,
      params: { startValue, endValue, x, y, duration }
    });
  }

  /**
   * Play win celebration combo (multiple effects)
   */
  static async playWinCelebration(winAmount: number, isJackpot: boolean = false): Promise<void> {
    const promises: Promise<void>[] = [];

    if (isJackpot) {
      // Jackpot: all effects!
      promises.push(this.playLightBeam(12, 3000));
      promises.push(this.playCoinShower(80, 4000));
      promises.push(this.playConfetti(150, 4000));
    } else if (winAmount > 1000) {
      // Big win
      promises.push(this.playCoinShower(50, 3000));
      promises.push(this.playGemExplosion(400, 300, 40, 2000));
    } else if (winAmount > 100) {
      // Medium win
      promises.push(this.playGemExplosion(400, 300, 30, 1500));
    }

    await Promise.all(promises);
  }

  /**
   * Clear all active effects
   */
  static clearAll(): void {
    this.effectManager.clearAll();
  }

  /**
   * Set maximum concurrent effects
   */
  static setMaxConcurrent(max: number): void {
    this.effectManager.setMaxConcurrent(max);
  }
}
