/**
 * Galacean Engine type wrappers and abstractions for the slot engine.
 * These provide a consistent API while abstracting away the underlying engine.
 */

import { 
  Entity, 
  Script, 
  Vector2, 
  Vector3, 
  Color, 
  Texture2D, 
  SpriteRenderer, 
  UnlitMaterial,
  Camera,
  Scene,
  Engine,
  Canvas,
  Sprite,
  TextRenderer,
  FontStyle,
  OverflowMode,
  HitResult,
  Font,
  TextHorizontalAlignment
} from '@galacean/engine';
import { LottieAnimation } from '@galacean/engine-lottie';
import { SpineAnimationRenderer } from '@galacean/engine-spine';
import { SkeletonData } from '@esotericsoftware/spine-core';

// Re-export Vector3 for use in other modules
export { Vector3 };
/**
 * Wrapper for a display container - equivalent to PIXI.Container
 */
export class GCContainer {
  public entity: Entity;
  private children: GCContainer[] = [];
  private parent: GCContainer | null = null;
  
  constructor(parent?: Entity | GCContainer, name: string = 'Container') {
    if (parent instanceof Entity) {
      this.entity = parent.createChild(name);
    } else if (parent instanceof GCContainer) {
      this.entity = parent.entity.createChild(name);
      parent.addChild(this);
    } else {
      throw new Error('GCContainer requires a parent Entity or GCContainer');
    }
    
    this.entity.transform.position = new Vector3(0, 0, 0);
    this.entity.transform.rotation = new Vector3(0, 0, 0);
    this.entity.transform.scale = new Vector3(1, 1, 1);
  }
  
  addChild(child: GCContainer): void {
    if (!this.children.includes(child)) {
      this.children.push(child);
      child.parent = this;
      // Move child entity under this entity
      if (child.entity.parent !== this.entity) {
        this.entity.addChild(child.entity);
      }
    }
  }
  
  removeChild(child: GCContainer): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child.entity.destroy();
    }
  }
  
  destroy(): void {
    for (const child of [...this.children]) {
      child.destroy();
    }
    this.children = [];
    this.parent = null;
    this.entity.destroy();
  }
  
  /**
   * Get all direct children of this container
   */
  getChildren(): GCContainer[] {
    return [...this.children];
  }
  
  set x(value: number) {
    this.entity.transform.position.x = value;
  }
  
  get x(): number {
    return this.entity.transform.position.x;
  }
  
  set y(value: number) {
    this.entity.transform.position.y = value;
  }
  
  get y(): number {
    return this.entity.transform.position.y;
  }
  
  set position(value: Vector3) {
    this.entity.transform.position = value;
  }
  
  get position(): Vector3 {
    return this.entity.transform.position;
  }
  
  set scale(value: Vector3) {
    this.entity.transform.scale = value;
  }
  
  get scale(): Vector3 {
    return this.entity.transform.scale;
  }
  
  /**
   * Helper method to set scale (mimics PIXI style)
   */
  setScale(x: number, y: number = x): void {
    this.entity.transform.scale = new Vector3(x, y, 1);
  }
  
  setRotation(x: number, y: number, z: number): void {
    this.entity.transform.rotation = new Vector3(x, y, z);
  }
  
  set visible(value: boolean) {
    this.entity.isActive = value;
  }
  
  get visible(): boolean {
    return this.entity.isActive;
  }
  
  set alpha(value: number) {
    // Set alpha on all renderers in this container
    const renderers: SpriteRenderer[] = [];
    this.entity.getComponentsIncludeChildren(SpriteRenderer, renderers);
    for (const renderer of renderers) {
      if (renderer.materialCount > 0) {
        const material = renderer.getMaterial(0);
        if (material) {
          // Use shaderData to set color alpha
          material.shaderData.setColor('u_baseColor', new Color(1, 1, 1, value));
        }
      }
    }
  }
  
  get alpha(): number {
    const renderers: SpriteRenderer[] = [];
    this.entity.getComponentsIncludeChildren(SpriteRenderer, renderers);
    if (renderers.length > 0 && renderers[0].materialCount > 0) {
      const material = renderers[0].getMaterial(0);
      if (material) {
        return material.shaderData.getColor('u_baseColor').a;
      }
    }
    return 1;
  }
  
  /**
   * Get bounds of this container
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    // Simplified bounds calculation
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Wrapper for Sprites
 */
export class GCSprite extends GCContainer {
  private spriteRenderer: SpriteRenderer | null = null;
  private _width: number = 0;
  private _height: number = 0;
  
  constructor(parent: GCContainer, texture: Texture2D, name: string = 'Sprite') {
    super(parent, name);
    
    this.spriteRenderer = this.entity.addComponent(SpriteRenderer);
    const sprite = new Sprite(this.entity.engine);
    sprite.texture = texture;
    this.spriteRenderer.sprite = sprite;
    
    this._width = texture.width;
    this._height = texture.height;
  }
  
  setTexture(texture: Texture2D): void {
    if (this.spriteRenderer) {
      const sprite = new Sprite(this.entity.engine);
      sprite.texture = texture;
      this.spriteRenderer.sprite = sprite;
      this._width = texture.width;
      this._height = texture.height;
    }
  }
  
  get texture(): Texture2D | null {
    return this.spriteRenderer?.sprite?.texture ?? null;
  }
  
  set tint(color: Color | number) {
    if (this.spriteRenderer && this.spriteRenderer.materialCount > 0) {
      const material = this.spriteRenderer.getMaterial(0);
      if (material) {
        if (typeof color === 'number') {
          // Convert hex number to Color
          const r = ((color >> 16) & 0xFF) / 255;
          const g = ((color >> 8) & 0xFF) / 255;
          const b = (color & 0xFF) / 255;
          const a = material.shaderData.getColor('u_baseColor').a;
          material.shaderData.setColor('u_baseColor', new Color(r, g, b, a));
        } else {
          material.shaderData.setColor('u_baseColor', color);
        }
      }
    }
  }
  
  get tint(): Color {
    if (this.spriteRenderer && this.spriteRenderer.materialCount > 0) {
      const material = this.spriteRenderer.getMaterial(0);
      if (material) {
        return material.shaderData.getColor('u_baseColor');
      }
    }
    return new Color(1, 1, 1, 1);
  }
  
  set width(value: number) {
    this._width = value;
    this.updateScale();
  }
  
  get width(): number {
    return this._width;
  }
  
  set height(value: number) {
    this._height = value;
    this.updateScale();
  }
  
  get height(): number {
    return this._height;
  }
  
  private updateScale(): void {
    if (this.spriteRenderer?.sprite?.texture) {
      const tex = this.spriteRenderer.sprite.texture;
      const scaleX = this._width / tex.width;
      const scaleY = this._height / tex.height;
      this.entity.transform.scale = new Vector3(scaleX, scaleY, 1);
    }
  }
  
  set anchor(value: { x: number; y: number }) {
    if (this.spriteRenderer?.sprite) {
      this.spriteRenderer.sprite.pivot = new Vector2(value.x, value.y);
    }
  }
  
  get anchor(): { x: number; y: number } {
    const pivot = this.spriteRenderer?.sprite?.pivot ?? new Vector2(0.5, 0.5);
    return { x: pivot.x, y: pivot.y };
  }
  
  set interactive(value: boolean) {
    this._interactive = value;
    // Will be handled by interaction system
    if (value) {
      this.entity.layer = 1; // Set to interactive layer
    }
  }
  
  get interactive(): boolean {
    return this._interactive;
  }

  set cursor(value: string) {
    // Cursor handling will be done via CSS on canvas
  }
  
  hitArea: { x: number; y: number; width: number; height: number } | null = null;
  private _listeners: Map<string, Set<(e: any) => void>> = new Map();
  private _buttonMode: boolean = false;
  private _interactive: boolean = false;

  set buttonMode(value: boolean) {
    this._buttonMode = value;
    if (value) {
      this.interactive = true;
    }
  }

  get buttonMode(): boolean {
    return this._buttonMode;
  }

  on(event: string, callback: (e: any) => void): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(callback);
    
    // Add native Galacean event listener for pointer events
    if (event === 'pointerdown' || event === 'pointerup' || event === 'pointerover' || event === 'pointerout') {
      const nativeEvent = `onPointer${event.charAt(7).toUpperCase()}${event.slice(8)}` as keyof Entity;
      const handler = (e: any) => {
        this._listeners.get(event)?.forEach(cb => cb(e));
      };
      // Store handler for removal
      if (!this._nativeHandlers) {
        this._nativeHandlers = new Map();
      }
      const key = `${event}_${callback.toString()}`;
      this._nativeHandlers.set(key, handler);
      (this.entity as any)[nativeEvent]?.(handler);
    }
  }

  off(event: string, callback: (e: any) => void): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(event);
      }
    }
    
    // Remove native handler
    if (this._nativeHandlers) {
      const key = `${event}_${callback.toString()}`;
      const handler = this._nativeHandlers.get(key);
      if (handler) {
        const nativeEvent = `onPointer${event.charAt(7).toUpperCase()}${event.slice(8)}` as keyof Entity;
        (this.entity as any)[nativeEvent]?.(handler);
        this._nativeHandlers.delete(key);
      }
    }
  }

  private _nativeHandlers: Map<string, (e: any) => void> | null = null;
}

/**
 * Wrapper for Text
 */
export class GCText extends GCContainer {
  private textRenderer: TextRenderer | null = null;
  private _text: string = '';
  private _fontSize: number = 24;
  private _fontFamily: string = 'Arial';
  private _fill: string | number = 0xffffff;
  private _align: 'left' | 'center' | 'right' = 'center';
  private _anchor: { x: number; y: number } = { x: 0.5, y: 0.5 };
  private _interactive: boolean = false;
  private _listeners: Map<string, Set<(e: any) => void>> = new Map();
  private _nativeHandlers: Map<string, (e: any) => void> | null = null;
  
  constructor(parent: GCContainer, text: string = '', style: any = {}) {
    super(parent, 'Text');
    
    this._text = text;
    if (style.fontSize) this._fontSize = style.fontSize;
    if (style.fontFamily) this._fontFamily = style.fontFamily;
    if (style.fill !== undefined) this._fill = style.fill;
    if (style.align) this._align = style.align;
    
    this.textRenderer = this.entity.addComponent(TextRenderer);
    this.updateTextProps();
  }
  
  set interactive(value: boolean) {
    this._interactive = value;
    if (value) {
      this.entity.layer = 1;
    }
  }
  
  get interactive(): boolean {
    return this._interactive;
  }
  
  set cursor(value: string) {
    // Cursor handling will be done via CSS on canvas
  }
  
  on(event: string, callback: (e: any) => void): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(callback);
    
    if (event === 'pointerdown' || event === 'pointerup' || event === 'pointerover' || event === 'pointerout') {
      const nativeEvent = `onPointer${event.charAt(7).toUpperCase()}${event.slice(8)}` as keyof Entity;
      const handler = (e: any) => {
        this._listeners.get(event)?.forEach(cb => cb(e));
      };
      if (!this._nativeHandlers) {
        this._nativeHandlers = new Map();
      }
      const key = `${event}_${callback.toString()}`;
      this._nativeHandlers.set(key, handler);
      (this.entity as any)[nativeEvent]?.(handler);
    }
  }
  
  private updateTextProps(): void {
    if (!this.textRenderer) return;
    
    let fillValue: string;
    if (typeof this._fill === 'number') {
      const r = ((this._fill >> 16) & 0xFF) / 255;
      const g = ((this._fill >> 8) & 0xFF) / 255;
      const b = (this._fill & 0xFF) / 255;
      fillValue = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    } else {
      fillValue = this._fill;
    }
    
    this.textRenderer.text = this._text;
    this.textRenderer.fontSize = this._fontSize;
    // Use font instead of fontFamily in Galacean Engine
    if (this._fontFamily && this.textRenderer.font) {
      // Font family is set via the Font object
      // For now, we'll just keep the existing font or use default
    }
    this.textRenderer.color = fillValue as unknown as Color;
    
    // Map alignment - using correct property name horizontalAlignment
    switch (this._align) {
      case 'left':
        this.textRenderer.horizontalAlignment = 0; // Left
        break;
      case 'center':
        this.textRenderer.horizontalAlignment = 1; // Center
        break;
      case 'right':
        this.textRenderer.horizontalAlignment = 2; // Right
        break;
    }
  }
  
  set text(value: string) {
    this._text = value;
    if (this.textRenderer) {
      this.textRenderer.text = value;
    }
  }
  
  get text(): string {
    return this._text;
  }
  
  set fontSize(value: number) {
    this._fontSize = value;
    if (this.textRenderer) {
      this.textRenderer.fontSize = value;
    }
  }
  
  get fontSize(): number {
    return this._fontSize;
  }
  
  set fontFamily(value: string) {
    this._fontFamily = value;
    // Font family is managed via the Font object in Galacean Engine
    // Setting fontFamily directly is not supported, users should set font instead
    if (this.textRenderer) {
      // Keep track of desired fontFamily for future font loading
      // The actual font would need to be loaded and assigned via textRenderer.font
    }
  }
  
  get fontFamily(): string {
    return this._fontFamily;
  }
  
  set fill(value: string | number) {
    this._fill = value;
    if (this.textRenderer) {
      this.updateTextProps();
    }
  }
  
  get fill(): string | number {
    return this._fill;
  }
  
  set align(value: 'left' | 'center' | 'right') {
    this._align = value;
    if (this.textRenderer) {
      this.updateTextProps();
    }
  }
  
  get anchor(): { x: number; y: number } {
    return this._anchor;
  }
  
  set anchor(value: { x: number; y: number }) {
    this._anchor = value;
    // Galacean Engine doesn't have pivot property on Transform
    // Anchor is typically handled by adjusting the sprite's position or using a different approach
    // For now, we store the anchor value but don't apply it directly to transform
    // Users may need to adjust entity.transform.position manually based on anchor
  }
  
  off(event: string, callback: (e: any) => void): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this._listeners.delete(event);
      }
    }
    
    if (this._nativeHandlers) {
      const key = `${event}_${callback.toString()}`;
      const handler = this._nativeHandlers.get(key);
      if (handler) {
        const nativeEvent = `onPointer${event.charAt(7).toUpperCase()}${event.slice(8)}` as keyof Entity;
        (this.entity as any)[nativeEvent]?.(handler);
        this._nativeHandlers.delete(key);
      }
    }
  }
}

/**
 * Wrapper for Graphics (drawing shapes)
 */
export class GCGraphics extends GCContainer {
  private vertices: number[] = [];
  private colors: number[] = [];
  private _lineWidth: number = 1;
  private _lineColor: number = 0xffffff;
  private _lineAlpha: number = 1;
  
  clear(): void {
    this.vertices = [];
    this.colors = [];
    // Remove existing mesh renderer if any
    const meshRenderer = this.entity.getComponent(SpriteRenderer);
    if (meshRenderer) {
      // Galacean Engine doesn't have removeComponent on Entity
      // We need to destroy the component or the entity instead
      // For now, we'll just clear the reference by disabling it
      meshRenderer.enabled = false;
      // Alternatively, destroy the entity if it only contains this component
      // meshRenderer.entity.destroy();
    }
  }
  
  beginFill(color: number, alpha?: number): this {
    // Store fill color for next drawing operation
    return this;
  }
  
  endFill(): this {
    return this;
  }
  
  drawRect(x: number, y: number, width: number, height: number): this {
    // For now, we'll create a simple colored sprite for rectangles
    // In a full implementation, this would use custom meshes
    return this;
  }
  
  drawCircle(x: number, y: number, radius: number): this {
    return this;
  }
  
  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): this {
    return this;
  }
  
  lineStyle(width: number, color?: number, alpha?: number): this {
    this._lineWidth = width;
    this._lineColor = color ?? 0xffffff;
    this._lineAlpha = alpha ?? 1;
    return this;
  }
  
  moveTo(x: number, y: number): this {
    // Store starting point for line drawing
    this.vertices.push(x, y);
    return this;
  }
  
  lineTo(x: number, y: number): this {
    // Store line endpoint
    this.vertices.push(x, y);
    return this;
  }
}

/**
 * Asset manager wrapper
 */
export class GCAssetManager {
  private static textures: Map<string, Texture2D> = new Map();
  
  static async loadTexture(url: string, key?: string): Promise<Texture2D> {
    const cacheKey = key || url;
    
    if (this.textures.has(cacheKey)) {
      return this.textures.get(cacheKey)!;
    }
    
    // In real implementation, use engine.resourceManager.loadResource
    // For now, we'll need to handle this through the engine instance
    throw new Error('Texture loading requires engine instance. Use Renderer.loadTexture instead.');
  }
  
  static registerTexture(key: string, texture: Texture2D): void {
    this.textures.set(key, texture);
  }
  
  static getTexture(key: string): Texture2D | undefined {
    return this.textures.get(key);
  }
}

/**
 * Simple tween/easing system to replace GSAP
 */
export class GCTween {
  private target: any;
  private props: Record<string, { from: number; to: number }>;
  private duration: number;
  private ease: string;
  private onCompleteCallback?: () => void;
  private startTime: number = 0;
  private isRunning: boolean = false;
  
  constructor(
    target: any,
    props: Record<string, number>,
    duration: number,
    ease: string = 'linear'
  ) {
    this.target = target;
    this.duration = duration * 1000; // Convert to ms
    this.ease = ease;
    this.props = {};
    
    // Capture current values
    for (const [key, value] of Object.entries(props)) {
      const currentValue = this.getValue(target, key);
      this.props[key] = { from: currentValue, to: value };
    }
  }
  
  private getValue(obj: any, path: string): number {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      current = current[part];
      if (current === undefined) return 0;
    }
    return current;
  }
  
  private setValue(obj: any, path: string, value: number): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  
  private easeFunction(t: number): number {
    switch (this.ease) {
      case 'linear':
        return t;
      case 'power2.out':
      case 'power2.inOut':
        return 1 - Math.pow(1 - t, 3);
      case 'power4.out':
        return 1 - Math.pow(1 - t, 5);
      case 'back.out(1.7)':
        const s = 1.7;
        return 1 + s * Math.pow(t - 1, 3) + t;
      case 'elastic.out(1, 0.45)':
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
      case 'power1.inOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }
  
  start(delay: number = 0): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.startTime = performance.now();
        this.isRunning = true;
        
        const animate = () => {
          if (!this.isRunning) return;
          
          const elapsed = performance.now() - this.startTime;
          const progress = Math.min(elapsed / this.duration, 1);
          const easedProgress = this.easeFunction(progress);
          
          // Update all properties
          for (const [key, { from, to }] of Object.entries(this.props)) {
            const value = from + (to - from) * easedProgress;
            this.setValue(this.target, key, value);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            this.isRunning = false;
            if (this.onCompleteCallback) {
              this.onCompleteCallback();
            }
            resolve();
          }
        };
        
        requestAnimationFrame(animate);
      }, delay);
    });
  }
  
  onComplete(callback: () => void): GCTween {
    this.onCompleteCallback = callback;
    return this;
  }
  
  kill(): void {
    this.isRunning = false;
  }
  
  static to(target: any, props: Record<string, number>, config: { duration: number; ease?: string; onComplete?: () => void; delay?: number }): { kill: () => void } {
    const tween = new GCTween(target, props, config.duration, config.ease || 'linear');
    if (config.onComplete) {
      tween.onComplete(config.onComplete);
    }
    tween.start(config.delay || 0);
    return { kill: () => tween.kill() };
  }
  
  static delayedCall(delay: number, callback: () => void): { kill: () => void } {
    const timeoutId = setTimeout(callback, delay * 1000);
    return { kill: () => clearTimeout(timeoutId) };
  }
  
  static timeline(config: { onComplete?: () => void }): { to: (target: any, props: any, params: any) => void; kill: () => void } {
    const tweens: GCTween[] = [];
    
    return {
      to: (target: any, props: any, params: any) => {
        const tween = new GCTween(target, props, params.duration, params.ease || 'linear');
        tweens.push(tween);
      },
      kill: () => {
        tweens.forEach(t => t.kill());
      }
    };
  }
  
  static killTweensOf(target: any): void {
    // Kill all tweens for this target
  }
}

/**
 * Timeline for sequencing animations
 */
export class GCTimeline {
  private tweens: Array<{ target: any; props: any; params: any; delay: number }> = [];
  private onCompleteCallback?: () => void;
  
  constructor(config: { onComplete?: () => void } = {}) {
    this.onCompleteCallback = config.onComplete;
  }
  
  to(target: any, props: any, params: any, offset?: string): this {
    let delay = 0;
    
    if (offset) {
      // Parse offset like "-=0.5" or "+=0.3"
      const match = offset.match(/^([+-]=)?([\d.]+)$/);
      if (match) {
        const op = match[1];
        const time = parseFloat(match[2]);
        if (op === '-=') {
          delay = -time;
        } else if (op === '+=') {
          delay = time;
        }
      }
    }
    
    this.tweens.push({ target, props, params, delay });
    return this;
  }
  
  add(tween: { kill: () => void }, delay: number = 0): this {
    // For compatibility with GSAP-style timeline.add()
    this.tweens.push({ 
      target: tween, 
      props: {}, 
      params: { duration: 0 }, 
      delay 
    });
    return this;
  }
  
  getTweens(): { kill: () => void }[] {
    return this.tweens.map(t => t.target as { kill: () => void });
  }
  
  async play(): Promise<void> {
    let currentTime = 0;
    
    for (const tween of this.tweens) {
      const startDelay = Math.max(0, currentTime + tween.delay);
      
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          GCTween.to(tween.target, tween.props, {
            ...tween.params,
            onComplete: () => resolve()
          });
        }, startDelay * 1000);
      });
      
      currentTime += tween.params.duration;
    }
    
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }
}

/**
 * Wrapper for Lottie animations - provides After Effects animation support
 */
export class GCLottie extends GCContainer {
  private lottieAnimation: LottieAnimation | null = null;
  private _playing: boolean = false;
  private _loop: boolean = false;
  
  constructor(parent: GCContainer, name: string = 'Lottie') {
    super(parent, name);
  }
  
  /**
   * Load and play a Lottie JSON animation
   * @param jsonUrl - URL to the Lottie JSON file
   * @param width - Display width
   * @param height - Display height
   */
  async loadAnimation(jsonUrl: string, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create Lottie animation component
      this.lottieAnimation = this.entity.addComponent(LottieAnimation);
      
      // Load the Lottie JSON resource
      this.entity.engine.resourceManager
        .load({
          url: jsonUrl,
          type: 'json'
        })
        .then((lottieData: any) => {
          if (!this.lottieAnimation) {
            reject(new Error('Lottie animation not initialized'));
            return;
          }
          
          // Note: LottieAnimation in Galacean uses resource loading differently
          // We need to set up the resource properly
          // For now, we'll store the data and mark as loaded
          this._playing = false;
          this._loop = false;
          
          resolve();
        })
        .catch((error) => {
          console.error('Failed to load Lottie animation:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Play the animation
   * @param loop - Whether to loop the animation
   */
  play(loop: boolean = false): void {
    if (!this.lottieAnimation) {
      console.warn('GCLottie: No animation loaded');
      return;
    }
    
    this._loop = loop;
    this._playing = true;
    this.lottieAnimation.isLooping = loop;
    this.lottieAnimation.play();
  }
  
  /**
   * Pause the animation
   */
  pause(): void {
    if (!this.lottieAnimation) return;
    this._playing = false;
    this.lottieAnimation.pause();
  }
  
  /**
   * Stop the animation and reset to beginning
   */
  stop(): void {
    if (!this.lottieAnimation) return;
    this._playing = false;
    this.lottieAnimation.stop();
  }
  
  /**
   * Resume a paused animation
   */
  resume(): void {
    if (!this.lottieAnimation) return;
    this._playing = true;
    // LottieAnimation doesn't have a resume method, so we'll just play again
    this.lottieAnimation.play();
  }
  
  /**
   * Go to a specific frame or time
   * @param time - Time in seconds (0-1 normalized or absolute)
   */
  goTo(time: number): void {
    if (!this.lottieAnimation) return;
    // Use frame property to set position
    const totalFrames = 60; // Approximation, should get from animation
    const targetFrame = Math.floor(time * totalFrames);
    (this.lottieAnimation as any)._curFrame = targetFrame;
  }
  
  /**
   * Set playback speed
   * @param speed - Speed multiplier (1 = normal, 2 = 2x, 0.5 = half speed)
   */
  setSpeed(speed: number): void {
    if (!this.lottieAnimation) return;
    this.lottieAnimation.speed = speed;
  }
  
  /**
   * Check if animation is currently playing
   */
  get isPlaying(): boolean {
    return this._playing;
  }
  
  /**
   * Set opacity
   * @param alpha - Opacity value (0-1)
   */
  set alpha(value: number) {
    if (this.lottieAnimation) {
      this.lottieAnimation.alpha = value;
    }
  }
  
  get alpha(): number {
    return this.lottieAnimation ? this.lottieAnimation.alpha : 1;
  }
  
  /**
   * Set visibility
   * @param visible - Whether to show the animation
   */
  set visible(value: boolean) {
    this.entity.isActive = value;
  }
  
  get visible(): boolean {
    return this.entity.isActive;
  }
  
  /**
   * Destroy the Lottie animation
   */
  destroy(): void {
    if (this.lottieAnimation) {
      this.lottieAnimation.destroy();
      this.lottieAnimation = null;
    }
    super.destroy();
  }
}

/**
 * Wrapper for Spine skeletal animations - provides Spine 2D animation support
 */
export class GCSpine extends GCContainer {
  private spineRenderer: SpineAnimationRenderer | null = null;
  private _playing: boolean = false;
  private _loop: boolean = false;
  private currentAnimation: string = '';
  
  constructor(parent: GCContainer, name: string = 'Spine') {
    super(parent, name);
  }
  
  /**
   * Load a Spine skeleton from atlas and skeleton JSON files
   * @param atlasUrl - URL to the Spine atlas file
   * @param skeletonUrl - URL to the Spine skeleton JSON file
   * @param imageUrl - URL to the spine texture image (optional if included in atlas)
   */
  async loadSkeleton(atlasUrl: string, skeletonUrl: string, imageUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use Galacean's Spine loader - load as SpineResource
      this.entity.engine.resourceManager
        .load({
          url: atlasUrl,
          type: 'spine'
        })
        .then((spineResource: any) => {
          // Create Spine renderer component
          this.spineRenderer = this.entity.addComponent(SpineAnimationRenderer);
          
          // Set the resource
          this.spineRenderer.resource = spineResource;
          
          this._playing = false;
          this._loop = false;
          
          resolve();
        })
        .catch((error) => {
          console.error('Failed to load Spine skeleton:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Get list of available animations
   */
  getAnimations(): string[] {
    if (!this.spineRenderer) {
      return [];
    }
    
    const animations: string[] = [];
    const skeleton = this.spineRenderer.skeleton;
    if (skeleton && skeleton.data && skeleton.data.animations) {
      for (const anim of skeleton.data.animations) {
        animations.push(anim.name);
      }
    }
    return animations;
  }
  
  /**
   * Set the current animation
   * @param name - Animation name
   * @param loop - Whether to loop
   * @param trackIndex - Track index (default 0)
   */
  setAnimation(name: string, loop: boolean = false, trackIndex: number = 0): void {
    if (!this.spineRenderer) {
      console.warn('GCSpine: No skeleton loaded');
      return;
    }
    
    this.currentAnimation = name;
    this._loop = loop;
    this.spineRenderer.state.setAnimation(trackIndex, name, loop);
  }
  
  /**
   * Add an animation to queue after current animation
   * @param name - Animation name
   * @param loop - Whether to loop
   * @param delay - Delay before starting (seconds)
   */
  addAnimation(name: string, loop: boolean = false, delay: number = 0): void {
    if (!this.spineRenderer) return;
    this.spineRenderer.state.addAnimation(0, name, loop, delay);
  }
  
  /**
   * Play the current animation
   */
  play(): void {
    if (!this.spineRenderer) return;
    this._playing = true;
  }
  
  /**
   * Pause the animation
   */
  pause(): void {
    if (!this.spineRenderer) return;
    this._playing = false;
  }
  
  /**
   * Stop the animation
   */
  stop(): void {
    if (!this.spineRenderer) return;
    this._playing = false;
    this.spineRenderer.state.clearTracks();
  }
  
  /**
   * Set animation playback speed
   * @param speed - Speed multiplier
   */
  setSpeed(speed: number): void {
    if (!this.spineRenderer) return;
    this.spineRenderer.state.timeScale = speed;
  }
  
  /**
   * Set a skin by name
   * @param skinName - Name of the skin to use
   */
  setSkin(skinName: string): void {
    if (!this.spineRenderer || !this.spineRenderer.skeleton) return;
    this.spineRenderer.skeleton.setSkinByName(skinName);
  }
  
  /**
   * Set color tint
   * @param color - Hex color value
   */
  setColor(color: number): void {
    if (!this.spineRenderer || !this.spineRenderer.skeleton) return;
    const r = ((color >> 16) & 0xFF) / 255;
    const g = ((color >> 8) & 0xFF) / 255;
    const b = (color & 0xFF) / 255;
    this.spineRenderer.skeleton.color.set(r, g, b, 1);
  }
  
  /**
   * Check if animation is playing
   */
  get isPlaying(): boolean {
    return this._playing;
  }
  
  /**
   * Get current animation name
   */
  getCurrentAnimation(): string {
    return this.currentAnimation;
  }
  
  /**
   * Set visibility
   */
  set visible(value: boolean) {
    this.entity.isActive = value;
  }
  
  get visible(): boolean {
    return this.entity.isActive;
  }
  
  /**
   * Set opacity
   */
  set alpha(value: number) {
    if (this.spineRenderer && this.spineRenderer.skeleton) {
      this.spineRenderer.skeleton.color.a = value;
    }
  }
  
  get alpha(): number {
    return this.spineRenderer && this.spineRenderer.skeleton 
      ? this.spineRenderer.skeleton.color.a 
      : 1;
  }
  
  /**
   * Destroy the Spine component
   */
  destroy(): void {
    if (this.spineRenderer) {
      this.spineRenderer.destroy();
      this.spineRenderer = null;
    }
    super.destroy();
  }
}
