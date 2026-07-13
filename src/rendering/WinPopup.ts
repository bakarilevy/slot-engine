import { GCContainer, GCGraphics, GCText, GCTween, GCTimeline } from '../types/GalaceanTypes.js';
import { GameState } from '../core/GameState.js';
import { type IUIConfig } from '../types/index.js';
import { UIFactory } from './UIFactory.js';
import { formatCurrency } from '../utils/NumberFormatter.js';

export class WinPopup {
  private container: GCContainer;
  private background: GCGraphics;
  private winText: GCText;
  private config: IUIConfig;
  private state: GameState;
  private isVisible: boolean = false;
  private tween: GCTween | null = null;

  constructor(parent: GCContainer, state: GameState, config: IUIConfig) {
    this.state = state;
    this.config = config;

    // Create container (hidden by default)
    this.container = UIFactory.createContainer(parent);
    this.container.visible = false;

    // Background (semi-transparent overlay)
    this.background = UIFactory.createRoundedRect(300, 100, 20, 0x000000, 0xffd700, 2, this.container);
    this.background.alpha = 0.85;

    // Win text
    this.winText = UIFactory.createText('+0.00', {
      fontSize: 48,
      fontFamily: 'Arial',
      fill: '#ffd700',
      fontWeight: 'bold',
      align: 'center',
    }, this.container);
    this.winText.x = 0;
    this.winText.y = 0;
  }

  /**
   * Set the position of the win popup.
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Show a win amount with a pop-up animation.
   */
  show(amount: number): void {
    if (amount <= 0) return;

    // If already visible, hide first
    if (this.isVisible) {
      this.hideImmediate();
    }

    const formatted = formatCurrency(amount, {
      decimalSeparator: this.config.decimalSeparator || '.',
      thousandSeparator: this.config.thousandSeparator || ',',
      minDecimalPlaces: this.config.minDecimalPlaces || 2,
      currencySymbol: this.config.currencySymbol || '$',
      currencyPosition: 'prefix',
    });
    this.winText.text = '+' + formatted;

    // Show with animation
    this.container.visible = true;
    this.container.scale.set(0.5, 0.5);
    this.container.alpha = 0;

    this.isVisible = true;

    // Kill any existing tween
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }

    // Animate in
    const tl = new GCTimeline({
      onComplete: () => {
        // Auto-hide after 2 seconds
        this.tween = GCTween.to(this.container, {
          alpha: 0,
          duration: 0.5,
          delay: 1.5,
          onComplete: () => {
            this.container.visible = false;
            this.isVisible = false;
            this.tween = null;
          },
        });
      },
    });

    tl.add(GCTween.to(this.container, {
      scale: 1.2,
      alpha: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
    })).add(GCTween.to(this.container, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    }));
    
    tl.play();
  }

  /**
   * Hide the popup immediately (no animation).
   */
  private hideImmediate(): void {
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }
    this.container.visible = false;
    this.isVisible = false;
  }

  /**
   * Destroy the win popup.
   */
  destroy(): void {
    if (this.tween) {
      this.tween.kill();
      this.tween = null;
    }
    this.container.destroy();
  }
}
