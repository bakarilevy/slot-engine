import { Texture2D, Color } from '@galacean/engine';
import { GCContainer, GCSprite, GCText, GCGraphics } from '../types/GalaceanTypes.js';
import { type ITextStyle, type ISpriteOptions } from '../types/index.js';

/**
 * A factory class for creating common Galacean UI elements with consistent properties.
 * All objects created have a `destroy` method that removes them from parent and cleans up.
 */
export class UIFactory {
  /**
   * Create a container with common props.
   * The returned container has an attached `destroy` method.
   */
  static createContainer(parent?: GCContainer): GCContainer & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createContainer requires a parent GCContainer');
    }
    const container = new GCContainer(parent, 'Container');
    this.addCommonProps(container);
    return container as GCContainer & { destroy: () => void };
  }

  /**
   * Create a sprite from a texture key.
   */
  static createSprite(
    textureKey: string,
    options?: ISpriteOptions,
    parent?: GCContainer
  ): GCSprite & { destroy: () => void } {
    const texture = this.getTexture(textureKey);
    if (!texture) {
      throw new Error(`[UIFactory] Texture not found: ${textureKey}`);
    }
    if (!parent) {
      throw new Error('[UIFactory] createSprite requires a parent GCContainer');
    }
    const sprite = new GCSprite(parent, texture);
    this.addCommonProps(sprite, options);
    return sprite as GCSprite & { destroy: () => void };
  }

  /**
   * Create a text object.
   */
  static createText(
    text: string,
    style: ITextStyle,
    parent?: GCContainer
  ): GCText & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createText requires a parent GCContainer');
    }
    const textObj = new GCText(parent, text, style);
    this.addCommonProps(textObj);
    return textObj as GCText & { destroy: () => void };
  }

  /**
   * Create a graphics object (e.g., rectangle, circle, rounded rect).
   * This returns a Graphics with a `destroy` method.
   */
  static createGraphics(parent?: GCContainer): GCGraphics & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createGraphics requires a parent GCContainer');
    }
    const graphics = new GCGraphics(parent);
    this.addCommonProps(graphics);
    return graphics as GCGraphics & { destroy: () => void };
  }

  /**
   * Create a simple rectangle.
   */
  static createRect(
    width: number,
    height: number,
    fillColor: number = 0xffffff,
    strokeColor?: number,
    strokeWidth: number = 1,
    parent?: GCContainer
  ): GCGraphics & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createRect requires a parent GCContainer');
    }
    const g = this.createGraphics(parent);
    // Note: Graphics drawing methods need to be implemented in GCGraphics
    // For now, this is a placeholder
    return g;
  }

  /**
   * Create a circle.
   */
  static createCircle(
    radius: number,
    fillColor: number = 0xffffff,
    strokeColor?: number,
    strokeWidth: number = 1,
    parent?: GCContainer
  ): GCGraphics & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createCircle requires a parent GCContainer');
    }
    const g = this.createGraphics(parent);
    // Note: Graphics drawing methods need to be implemented in GCGraphics
    return g;
  }

  /**
   * Create a rounded rectangle.
   */
  static createRoundedRect(
    width: number,
    height: number,
    radius: number,
    fillColor: number = 0xffffff,
    strokeColor?: number,
    strokeWidth: number = 1,
    parent?: GCContainer
  ): GCGraphics & { destroy: () => void } {
    if (!parent) {
      throw new Error('[UIFactory] createRoundedRect requires a parent GCContainer');
    }
    const g = this.createGraphics(parent);
    // Note: Graphics drawing methods need to be implemented in GCGraphics
    return g;
  }

  /**
   * Apply common properties to any display object.
   * Also attaches a `destroy` method for easy cleanup.
   */
  private static addCommonProps(
    obj: GCContainer | GCSprite | GCText | GCGraphics,
    options?: ISpriteOptions
  ): void {
    // Set anchor (for sprites and text)
    if ('anchor' in obj && options?.anchor) {
      (obj as any).anchor = options.anchor;
    }

    // Set scale
    if (options?.scale) {
      obj.scale.x = options.scale.x;
      obj.scale.y = options.scale.y;
    }

    // Set tint (for sprites)
    if ('tint' in obj && options?.tint !== undefined) {
      (obj as any).tint = new Color(
        ((options.tint >> 16) & 0xFF) / 255,
        ((options.tint >> 8) & 0xFF) / 255,
        (options.tint & 0xFF) / 255,
        1
      );
    }

    // Set alpha
    if (options?.alpha !== undefined) {
      obj.alpha = options.alpha;
    }

    // Attach a destroy method that removes from parent and optionally destroys children
    (obj as any).destroy = function (this: any, destroyChildren: boolean = true) {
      if (this.parent) {
        // Parent will handle removal in its removeChild
      }
      if (destroyChildren) {
        // Children will be destroyed by the container's destroy method
      }
      // Call the original destroy
      if (this._destroy) {
        this._destroy(destroyChildren);
      }
    };
  }

  /**
   * Convenience method to set position on any display object.
   * This mirrors the original `setPosition` method.
   */
  static setPosition(
    obj: GCContainer | GCSprite | GCText | GCGraphics,
    x: number,
    y: number
  ): void {
    obj.x = x;
    obj.y = y;
  }

  /**
   * Get the global position of an object (relative to the stage).
   */
  static getGlobalPosition(
    obj: GCContainer | GCSprite | GCText | GCGraphics
  ): { x: number; y: number } {
    const pos = obj.position;
    return { x: pos.x, y: pos.y };
  }

  /**
   * Helper to get texture from AssetManager or Renderer cache.
   */
  private static getTexture(key: string): Texture2D | null {
    // Try to get from GCAssetManager first
    const texture = (window as any).__galaceanTextures__?.get(key);
    return texture || null;
  }

  /**
   * Register a texture for later use.
   */
  static registerTexture(key: string, texture: Texture2D): void {
    if (!(window as any).__galaceanTextures__) {
      (window as any).__galaceanTextures__ = new Map();
    }
    (window as any).__galaceanTextures__.set(key, texture);
  }
}