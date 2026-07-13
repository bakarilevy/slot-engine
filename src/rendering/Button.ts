import { GCContainer, GCSprite, GCTween, GCAssetManager } from '../types/GalaceanTypes.js';
import { UIFactory } from './UIFactory.js';
import { type IButtonConfig } from '../types/index.js';

export class Button {
  private container: GCContainer & { destroy: () => void };
  private sprite: GCSprite & { destroy: () => void };
  private config: IButtonConfig;
  private _enabled: boolean = true;
  private _clickHandler: (() => void) | null = null;
  private _hoverHandler: ((hovering: boolean) => void) | null = null;
  private _pointerDownListener: ((e: PointerEvent) => void) | null = null;
  private _pointerUpListener: ((e: PointerEvent) => void) | null = null;
  private _pointerOverListener: ((e: PointerEvent) => void) | null = null;
  private _pointerOutListener: ((e: PointerEvent) => void) | null = null;

  /**
   * Creates a button with texture-based states.
   * @param parent - Parent container to add the button to.
   * @param config - Button configuration.
   * @param width - Width for hit area (defaults to sprite width).
   * @param height - Height for hit area (defaults to sprite height).
   */
  constructor(
    parent: GCContainer,
    config: IButtonConfig,
    width?: number,
    height?: number
  ) {
    this.config = config;
    
    // Create container and sprite
    this.container = UIFactory.createContainer(parent);
    this.sprite = UIFactory.createSprite(config.defaultTexture, this.container);
    
    if (width && height) {
      this.sprite.width = width;
      this.sprite.height = height;
    }
    
    // Set up interactivity
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    
    // Create bound listeners
    this._pointerDownListener = this._onPointerDown.bind(this);
    this._pointerUpListener = this._onPointerUp.bind(this);
    this._pointerOverListener = this._onPointerOver.bind(this);
    this._pointerOutListener = this._onPointerOut.bind(this);
    
    // Add event listeners
    this.sprite.on('pointerdown', this._pointerDownListener);
    this.sprite.on('pointerup', this._pointerUpListener);
    this.sprite.on('pointerover', this._pointerOverListener);
    this.sprite.on('pointerout', this._pointerOutListener);
  }

  private _onPointerDown(e: PointerEvent): void {
    if (!this._enabled) return;
    // Scale down slightly on press
    GCTween.to(this.sprite, { scaleX: 0.95, scaleY: 0.95 }, { duration: 0.1 });
  }

  private _onPointerUp(e: PointerEvent): void {
    if (!this._enabled) return;
    // Scale back to normal
    GCTween.to(this.sprite, { scaleX: 1, scaleY: 1 }, { duration: 0.1 });
    
    // Trigger click handler
    if (this._clickHandler) {
      this._clickHandler();
    }
  }

  private _onPointerOver(e: PointerEvent): void {
    if (!this._enabled) return;
    // Brighten on hover
    GCTween.to(this.sprite, { tint: 0xcccccc }, { duration: 0.15 });
    
    if (this._hoverHandler) {
      this._hoverHandler(true);
    }
  }

  private _onPointerOut(e: PointerEvent): void {
    if (!this._enabled) return;
    // Restore original tint
    GCTween.to(this.sprite, { tint: 0xffffff }, { duration: 0.15 });
    
    if (this._hoverHandler) {
      this._hoverHandler(false);
    }
  }

  /**
   * Set the click handler.
   */
  onClick(handler: () => void): void {
    this._clickHandler = handler;
  }

  /**
   * Set the hover handler.
   */
  onHover(handler: (hovering: boolean) => void): void {
    this._hoverHandler = handler;
  }

  /**
   * Set button position.
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Set button texture.
   */
  setTexture(texture: string): void {
    const tex = GCAssetManager.getTexture(texture);
    if (tex) {
      this.sprite.setTexture(tex);
    }
  }

  /**
   * Enable or disable the button.
   */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.sprite.alpha = enabled ? 1 : 0.5;
    this.sprite.interactive = enabled;
  }

  /**
   * Check if the button is enabled.
   */
  isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Get the container.
   */
  getDisplayObject(): GCContainer {
    return this.container;
  }

  /**
   * Destroy the button and clean up.
   */
  destroy(): void {
    if (this._pointerDownListener) {
      this.sprite.off('pointerdown', this._pointerDownListener);
    }
    if (this._pointerUpListener) {
      this.sprite.off('pointerup', this._pointerUpListener);
    }
    if (this._pointerOverListener) {
      this.sprite.off('pointerover', this._pointerOverListener);
    }
    if (this._pointerOutListener) {
      this.sprite.off('pointerout', this._pointerOutListener);
    }
    this.container.destroy();
  }
}
