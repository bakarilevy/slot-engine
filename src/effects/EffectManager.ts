import { GCContainer, GCSprite, GCTween, GCGraphics, GCTimeline } from '../types/GalaceanTypes';
import { Renderer } from '../core/Renderer';

/**
 * Effect priority levels for queue management
 */
export enum EffectPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Configuration for effect instances
 */
export interface EffectConfig {
  id: string;
  type: string;
  priority: EffectPriority;
  duration?: number;
  autoCleanup?: boolean;
  params?: Record<string, any>;
}

/**
 * Pool manager for reusable effects
 */
class EffectPool {
  private pools: Map<string, Array<any>> = new Map();

  get<T>(type: string): T | null {
    const pool = this.pools.get(type);
    if (pool && pool.length > 0) {
      return pool.pop() as T;
    }
    return null;
  }

  release<T>(type: string, effect: T): void {
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    this.pools.get(type)!.push(effect);
  }

  clear(): void {
    this.pools.clear();
  }
}

/**
 * Centralized effect manager for slot machine visual effects
 * Handles creation, pooling, prioritization, and cleanup of effects
 */
export class EffectManager {
  private static instance: EffectManager;
  private effects: Map<string, any> = new Map();
  private effectQueue: Array<{ config: EffectConfig; resolve: () => void }> = [];
  private pool: EffectPool = new EffectPool();
  private activeCount: number = 0;
  private maxConcurrentEffects: number = 10;
  private isProcessing: boolean = false;

  private constructor() {}

  static getInstance(): EffectManager {
    if (!EffectManager.instance) {
      EffectManager.instance = new EffectManager();
    }
    return EffectManager.instance;
  }

  /**
   * Create and play an effect
   */
  async createEffect(config: EffectConfig): Promise<void> {
    return new Promise((resolve) => {
      this.effectQueue.push({ config, resolve });
      this.processQueue();
    });
  }

  /**
   * Process the effect queue based on priority
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeCount >= this.maxConcurrentEffects) {
      return;
    }

    this.isProcessing = true;

    while (this.effectQueue.length > 0 && this.activeCount < this.maxConcurrentEffects) {
      // Sort by priority (highest first)
      this.effectQueue.sort((a, b) => b.config.priority - a.config.priority);
      
      const item = this.effectQueue.shift()!;
      await this.playEffect(item.config);
      item.resolve();
    }

    this.isProcessing = false;
  }

  /**
   * Play a specific effect based on type
   */
  private async playEffect(config: EffectConfig): Promise<void> {
    this.activeCount++;
    
    try {
      switch (config.type) {
        case 'coinShower':
          await this.playCoinShower(config);
          break;
        case 'gemExplosion':
          await this.playGemExplosion(config);
          break;
        case 'lightBeam':
          await this.playLightBeam(config);
          break;
        case 'confetti':
          await this.playConfetti(config);
          break;
        case 'spinBlur':
          await this.playSpinBlur(config);
          break;
        case 'stopImpact':
          await this.playStopImpact(config);
          break;
        case 'symbolGlow':
          await this.playSymbolGlow(config);
          break;
        case 'buttonRipple':
          await this.playButtonRipple(config);
          break;
        case 'balanceCountUp':
          await this.playBalanceCountUp(config);
          break;
        default:
          console.warn(`Unknown effect type: ${config.type}`);
      }

      // Auto cleanup if enabled
      if (config.autoCleanup !== false) {
        await this.cleanupEffect(config.id);
      }
    } catch (error) {
      console.error(`Error playing effect ${config.type}:`, error);
    } finally {
      this.activeCount--;
    }
  }

  /**
   * Coin shower effect for big wins
   */
  private async playCoinShower(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const coinCount = config.params?.count || 50;
    const duration = config.params?.duration || 3000;

    const coins: GCSprite[] = [];
    
    for (let i = 0; i < coinCount; i++) {
      const coin = new GCSprite();
      coin.x = Math.random() * 800;
      coin.y = -50 - Math.random() * 200;
      coin.width = 30;
      coin.height = 30;
      coin.rotation = Math.random() * Math.PI * 2;
      
      container.addChild(coin);
      coins.push(coin);

      // Animate coin falling
      const fallDuration = duration / 1000 + Math.random() * 1;
      const targetX = Math.random() * 800;
      const targetY = 600 + Math.random() * 100;

      GCTween.to(coin, {
        y: targetY,
        x: targetX,
        rotation: coin.rotation + Math.PI * 4,
      }, {
        duration: fallDuration,
        ease: 'power1.in',
        delay: Math.random() * 0.5
      });

      // Fade out at end
      GCTween.to(coin, {
        alpha: 0
      }, {
        duration: 0.3,
        delay: fallDuration - 0.3
      });
    }

    this.effects.set(config.id, { coins, container });

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Gem explosion burst effect
   */
  private async playGemExplosion(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const x = config.params?.x || 400;
    const y = config.params?.y || 300;
    const particleCount = config.params?.particleCount || 30;
    const duration = config.params?.duration || 1500;

    const particles: GCGraphics[] = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

    for (let i = 0; i < particleCount; i++) {
      const particle = new GCGraphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 5 + Math.random() * 10;
      
      particle.beginFill(color);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      particle.x = x;
      particle.y = y;
      
      container.addChild(particle);
      particles.push(particle);

      // Calculate random direction
      const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
      const distance = 100 + Math.random() * 150;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      // Animate outward
      GCTween.to(particle, {
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.1
      }, {
        duration: duration / 1000,
        ease: 'power2.out'
      });
    }

    this.effects.set(config.id, { particles, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Light beam rays for jackpot wins
   */
  private async playLightBeam(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const beamCount = config.params?.count || 8;
    const duration = config.params?.duration || 2000;

    const beams: GCGraphics[] = [];

    for (let i = 0; i < beamCount; i++) {
      const beam = new GCGraphics();
      const angle = (Math.PI * 2 / beamCount) * i;
      
      beam.beginFill(0xffff00, 0.3);
      beam.moveTo(400, 300);
      beam.lineTo(400 + Math.cos(angle) * 400, 300 + Math.sin(angle) * 400);
      beam.lineTo(400 + Math.cos(angle + 0.2) * 400, 300 + Math.sin(angle + 0.2) * 400);
      beam.endFill();
      
      beam.alpha = 0;
      container.addChild(beam);
      beams.push(beam);

      // Pulse animation
      GCTween.to(beam, {
        alpha: 0.8
      }, {
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        delay: i * 0.1
      });
    }

    this.effects.set(config.id, { beams, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Confetti cascade effect using Lottie
   */
  private async playConfetti(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const jsonUrl = config.params?.jsonUrl || 'assets/effects/confetti.json';
    
    // This would use GCLottie when available
    // For now, create a simple particle version
    const confettiCount = config.params?.count || 100;
    const duration = config.params?.duration || 3000;

    const pieces: GCGraphics[] = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500];

    for (let i = 0; i < confettiCount; i++) {
      const piece = new GCGraphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const width = 8 + Math.random() * 8;
      const height = 8 + Math.random() * 8;
      
      piece.beginFill(color);
      piece.drawRect(0, 0, width, height);
      piece.endFill();
      
      piece.x = Math.random() * 800;
      piece.y = -20 - Math.random() * 100;
      piece.rotation = Math.random() * Math.PI;
      
      container.addChild(piece);
      pieces.push(piece);

      // Falling with rotation
      const fallTime = 2 + Math.random() * 1.5;
      GCTween.to(piece, {
        y: 650,
        rotation: piece.rotation + Math.PI * 3,
        x: piece.x + (Math.random() - 0.5) * 100
      }, {
        duration: fallTime,
        ease: 'power1.in',
        delay: Math.random() * 1
      });

      GCTween.to(piece, {
        alpha: 0
      }, {
        duration: 0.5,
        delay: fallTime - 0.5
      });
    }

    this.effects.set(config.id, { pieces, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Spin blur trail effect
   */
  private async playSpinBlur(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const reelIndex = config.params?.reelIndex || 0;
    const reelWidth = config.params?.reelWidth || 100;
    const reelHeight = config.params?.reelHeight || 400;
    const x = config.params?.x || 100 + reelIndex * 100;
    const duration = config.params?.duration || 500;

    const blurs: GCGraphics[] = [];
    const blurCount = 5;

    for (let i = 0; i < blurCount; i++) {
      const blur = new GCGraphics();
      blur.beginFill(0xffffff, 0.1);
      blur.drawRect(x, 0, reelWidth, reelHeight);
      blur.endFill();
      
      blur.alpha = 0;
      container.addChild(blur);
      blurs.push(blur);

      // Staggered fade in/out
      GCTween.to(blur, {
        alpha: 0.3
      }, {
        duration: 0.1,
        delay: i * 0.05,
        yoyo: true,
        repeat: 3
      });
    }

    this.effects.set(config.id, { blurs, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Reel stop impact flash
   */
  private async playStopImpact(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const x = config.params?.x || 400;
    const y = config.params?.y || 300;
    const duration = config.params?.duration || 300;

    const flash = new GCGraphics();
    flash.beginFill(0xffffff, 0.8);
    flash.drawCircle(0, 0, 50);
    flash.endFill();
    
    flash.x = x;
    flash.y = y;
    flash.scale = 0;
    
    container.addChild(flash);

    // Expand and fade
    GCTween.to(flash, {
      scale: 2,
      alpha: 0
    }, {
      duration: duration / 1000,
      ease: 'power2.out'
    });

    this.effects.set(config.id, { flash, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Symbol glow/highlight on win
   */
  private async playSymbolGlow(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const symbols = config.params?.symbols || [];
    const duration = config.params?.duration || 2000;
    const color = config.params?.color || 0xffff00;

    const glows: GCGraphics[] = [];

    for (const symbol of symbols) {
      const glow = new GCGraphics();
      glow.lineStyle(3, color, 0.8);
      glow.drawRect(-2, -2, symbol.width + 4, symbol.height + 4);
      
      glow.x = symbol.x;
      glow.y = symbol.y;
      glow.alpha = 0;
      
      container.addChild(glow);
      glows.push(glow);

      // Pulse glow
      GCTween.to(glow, {
        alpha: 1
      }, {
        duration: 0.3,
        yoyo: true,
        repeat: 3
      });
    }

    this.effects.set(config.id, { glows, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Button press ripple effect
   */
  private async playButtonRipple(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const x = config.params?.x || 400;
    const y = config.params?.y || 500;
    const duration = config.params?.duration || 400;

    const ripple = new GCGraphics();
    ripple.lineStyle(2, 0xffffff, 0.6);
    ripple.drawCircle(0, 0, 0);
    
    ripple.x = x;
    ripple.y = y;
    
    container.addChild(ripple);

    // Expand ripple
    GCTween.to(ripple, {
      scale: 3,
      alpha: 0
    }, {
      duration: duration / 1000,
      ease: 'power2.out'
    });

    this.effects.set(config.id, { ripple, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Balance count-up animation with particles
   */
  private async playBalanceCountUp(config: EffectConfig): Promise<void> {
    const container = Renderer.getInstance().getStage();
    const startValue = config.params?.startValue || 0;
    const endValue = config.params?.endValue || 1000;
    const duration = config.params?.duration || 1500;
    const x = config.params?.x || 100;
    const y = config.params?.y || 50;

    // Create particle burst
    const particleCount = 20;
    const particles: GCGraphics[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = new GCGraphics();
      particle.beginFill(0xffd700, 0.8);
      particle.drawCircle(0, 0, 3 + Math.random() * 3);
      particle.endFill();
      
      particle.x = x;
      particle.y = y;
      
      container.addChild(particle);
      particles.push(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      
      GCTween.to(particle, {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0
      }, {
        duration: duration / 1000,
        ease: 'power2.out'
      });
    }

    this.effects.set(config.id, { particles, container });

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Cleanup effect resources
   */
  async cleanupEffect(id: string): Promise<void> {
    const effect = this.effects.get(id);
    if (effect) {
      // Remove all children from container
      if (effect.coins) {
        effect.coins.forEach((coin: GCSprite) => {
          if (coin.parent) {
            coin.parent.removeChild(coin);
          }
        });
      }
      if (effect.particles) {
        effect.particles.forEach((p: GCGraphics) => {
          if (p.parent) {
            p.parent.removeChild(p);
          }
        });
      }
      if (effect.beams) {
        effect.beams.forEach((b: GCGraphics) => {
          if (b.parent) {
            b.parent.removeChild(b);
          }
        });
      }
      if (effect.pieces) {
        effect.pieces.forEach((p: GCGraphics) => {
          if (p.parent) {
            p.parent.removeChild(p);
          }
        });
      }
      if (effect.blurs) {
        effect.blurs.forEach((b: GCGraphics) => {
          if (b.parent) {
            b.parent.removeChild(b);
          }
        });
      }
      if (effect.flash) {
        if (effect.flash.parent) {
          effect.flash.parent.removeChild(effect.flash);
        }
      }
      if (effect.glows) {
        effect.glows.forEach((g: GCGraphics) => {
          if (g.parent) {
            g.parent.removeChild(g);
          }
        });
      }
      if (effect.ripple) {
        if (effect.ripple.parent) {
          effect.ripple.parent.removeChild(effect.ripple);
        }
      }

      this.effects.delete(id);
    }
  }

  /**
   * Clear all active effects
   */
  clearAll(): void {
    this.effectQueue = [];
    this.effects.forEach((_, id) => {
      this.cleanupEffect(id);
    });
    this.pool.clear();
    this.activeCount = 0;
  }

  /**
   * Set maximum concurrent effects
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrentEffects = max;
  }

  /**
   * Get current active effect count
   */
  getActiveCount(): number {
    return this.activeCount;
  }
}
