import { 
  Vector3, 
  Color,
  Camera,
  Entity,
  Vector2,
  Engine
} from '@galacean/engine';
import { WebGLEngine } from '@galacean/engine-rhi-webgl';
import { GCContainer, GCAssetManager } from '../types/GalaceanTypes.js';
import { type IResizeable } from '../types/index.js';
import { GameConfig } from '../core/GameConfig.js';

export class Renderer {
  private engine: WebGLEngine | null = null;
  private rootEntity: Entity | null = null;
  private camera: Camera | null = null;
  private config: GameConfig;
  private resizeables: Set<IResizeable> = new Set();
  private _scale: number = 1;
  private _width: number = 0;
  private _height: number = 0;
  private containers: Map<string, GCContainer> = new Map();
  private initPromise: Promise<void>;

  constructor(config: GameConfig, container: HTMLElement) {
    this.config = config;

    // Store dimensions
    this._width = container.clientWidth || window.innerWidth;
    this._height = container.clientHeight || window.innerHeight;

    // Create WebGL Engine asynchronously and initialize
    this.initPromise = WebGLEngine.create({
      canvas: container as HTMLCanvasElement
    }).then((engine) => {
      this.engine = engine;
      this.rootEntity = engine.sceneManager.activeScene.createRootEntity('Root');

      // Create orthographic camera for 2D slot game
      const cameraEntity = this.rootEntity.createChild('Camera');
      this.camera = cameraEntity.addComponent(Camera);
      this.camera.isOrthographic = true;
      
      this.updateCameraOrthographicSize();

      // Initialize engine
      this.engine.run();
    });

    // Listen to window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Wait for the engine to be initialized.
   */
  async ready(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Get the Galacean engine instance.
   */
  getEngine(): WebGLEngine | null {
    return this.engine;
  }

  /**
   * Get the root entity (stage equivalent).
   */
  getRootEntity(): Entity | null {
    return this.rootEntity;
  }

  /**
   * Get the camera component.
   */
  getCamera(): Camera | null {
    return this.camera;
  }

  /**
   * Create a root container for UI elements.
   */
  createContainer(name: string = 'Container'): GCContainer {
    if (!this.rootEntity) {
      throw new Error('Engine not initialized yet. Call ready() first.');
    }
    const container = new GCContainer(this.rootEntity, name);
    this.containers.set(name, container);
    return container;
  }

  /**
   * Get a container by name.
   */
  getContainer(name: string): GCContainer | undefined {
    return this.containers.get(name);
  }

  /**
   * Load a texture from URL.
   */
  async loadTexture(url: string, key?: string): Promise<any> {
    if (!this.engine) {
      throw new Error('Engine not initialized yet.');
    }
    const cacheKey = key || url;
    const texture = await this.engine.resourceManager.load<any>(url);
    if (key) {
      GCAssetManager.registerTexture(key, texture);
    }
    return texture;
  }

  /**
   * Get the current scale factor (relative to a reference size, e.g., 1080p).
   * This is used to scale UI elements consistently across resolutions.
   */
  get scale(): number {
    return this._scale;
  }

  /**
   * Get the current viewport width.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get the current viewport height.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Register a resizeable object.
   * It will be notified on every resize.
   */
  registerResizeable(obj: IResizeable): void {
    this.resizeables.add(obj);
    // Immediately notify with current dimensions
    obj.onResize(this._width, this._height, this._scale);
  }

  /**
   * Unregister a resizeable object.
   */
  unregisterResizeable(obj: IResizeable): void {
    this.resizeables.delete(obj);
  }

  /**
   * Destroy the renderer and clean up.
   */
  destroy(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.containers.forEach(c => c.destroy());
    this.containers.clear();
    this.resizeables.clear();
    if (this.engine) {
      this.engine.destroy();
    }
  }

  private updateCameraOrthographicSize(): void {
    if (!this.camera) return;
    
    // Set orthographic size based on reference height of 1080
    const referenceHeight = 1080;
    this.camera.orthographicSize = referenceHeight / 2;
  }

  private onWindowResize(): void {
    if (!this.engine) return;
    
    const canvas = this.engine.canvas;
    this._width = canvas.width;
    this._height = canvas.height;

    // Update canvas size
    canvas.width = this._width;
    canvas.height = this._height;

    // Compute scale relative to a reference height of 1080px
    // This is a typical slot game baseline
    const referenceHeight = 1080;
    const scaleX = this._width / (referenceHeight * (16 / 9));
    const scaleY = this._height / referenceHeight;
    this._scale = Math.min(scaleX, scaleY);

    // Update camera orthographic size
    this.updateCameraOrthographicSize();

    // Notify all resizeable objects
    for (const obj of this.resizeables) {
      obj.onResize(this._width, this._height, this._scale);
    }
  }
}
