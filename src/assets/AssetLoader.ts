import { Engine, Texture2D, Sprite } from '@galacean/engine';
import { GameConfig } from '../core/GameConfig.js';
import { LocalizationService } from './LocalizationService.js';
import { FontManager } from './FontManager.js';
import { SoundManager } from './SoundManager.js';
import { type ILocalizationData, type IFontConfig, type ISoundConfig } from '../types/index.js';

/**
 * Configuration for texture atlas/spritesheet
 * Supports multiple atlas formats: TexturePacker, FreeType, custom JSON formats
 */
export interface IAtlasConfig {
  /** Unique name for this atlas */
  name: string;
  /** Path to the atlas JSON file */
  jsonUrl: string;
  /** Path to the atlas image file */
  imageUrl: string;
  /** Atlas format: 'texturepacker' | 'freetype' | 'custom' | 'auto' */
  format?: 'texturepacker' | 'freetype' | 'custom' | 'auto';
  /** Optional scale factor for HiDPI displays */
  scale?: number;
}

/**
 * Configuration for individual texture images
 */
export interface ITextureConfig {
  /** Unique key to reference this texture */
  key: string;
  /** Path to the image file */
  url: string;
  /** Optional frame rect for sprite sheets [x, y, width, height] */
  frame?: [number, number, number, number];
}

/**
 * Configuration for Lottie animations
 */
export interface ILottieConfig {
  /** Unique key to reference this animation */
  key: string;
  /** Path to the Lottie JSON file */
  url: string;
  /** Optional preloading priority */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Configuration for Spine animations
 */
export interface ISpineConfig {
  /** Unique key to reference this skeleton */
  key: string;
  /** Path to the Spine .json or .skel file */
  skeletonUrl: string;
  /** Path to the Spine atlas file */
  atlasUrl: string;
  /** Path(s) to Spine texture image(s) */
  textureUrls: string[];
  /** Optional preloading priority */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Comprehensive asset manifest supporting multiple asset types
 */
export interface IAssetManifest {
  /** Font configurations */
  fonts?: IFontConfig[];
  /** Sound configurations */
  sounds?: ISoundConfig[];
  /** Individual texture images */
  textures?: (string | ITextureConfig)[];
  /** Texture atlases/spritesheets */
  atlases?: IAtlasConfig[];
  /** Lottie animations */
  lottie?: ILottieConfig[];
  /** Spine animations */
  spine?: ISpineConfig[];
  /** Custom assets (any other type) */
  custom?: Array<{
    key: string;
    url: string;
    type: string;
  }>;
}

/**
 * Loaded asset data structure
 */
export interface ILoadedAssets {
  textures: Map<string, Texture2D>;
  sprites: Map<string, Sprite>;
  lottieAnimations: Map<string, any>;
  spineSkeletons: Map<string, any>;
  customAssets: Map<string, any>;
}

export class AssetLoader {
  private config: GameConfig;
  private localization: LocalizationService;
  private fontManager: FontManager;
  private soundManager: SoundManager;
  private engine: Engine | null = null;
  
  private manifest: IAssetManifest | null = null;
  private loaded: boolean = false;
  private loadingProgress: number = 0;
  private totalAssets: number = 0;
  private loadedAssets: number = 0;
  
  // Loaded asset storage
  private textures: Map<string, Texture2D> = new Map();
  private sprites: Map<string, Sprite> = new Map();
  private lottieAnimations: Map<string, any> = new Map();
  private spineSkeletons: Map<string, any> = new Map();
  private customAssets: Map<string, any> = new Map();
  
  // Progress callback
  private onProgressCallback: ((progress: number, loaded: number, total: number) => void) | null = null;

  constructor(config: GameConfig) {
    this.config = config;
    this.localization = new LocalizationService(config);
    this.fontManager = new FontManager();
    this.soundManager = new SoundManager();
  }

  /**
   * Set the engine instance for asset loading.
   */
  setEngine(engine: Engine): void {
    this.engine = engine;
  }

  /**
   * Set the asset manifest (could be loaded from a JSON file or passed in).
   */
  setManifest(manifest: IAssetManifest): void {
    this.manifest = manifest;
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (progress: number, loaded: number, total: number) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Calculate total assets to load
   */
  private calculateTotalAssets(): number {
    if (!this.manifest) return 0;
    
    let total = 0;
    
    if (this.manifest.fonts) total += this.manifest.fonts.length;
    if (this.manifest.sounds) total += this.manifest.sounds.length;
    if (this.manifest.textures) total += this.manifest.textures.length;
    if (this.manifest.atlases) total += this.manifest.atlases.length * 2; // JSON + image
    if (this.manifest.lottie) total += this.manifest.lottie.length;
    if (this.manifest.spine) {
      this.manifest.spine.forEach(spine => {
        total += 2 + spine.textureUrls.length; // skeleton + atlas + textures
      });
    }
    if (this.manifest.custom) total += this.manifest.custom.length;
    
    return total;
  }

  /**
   * Report loading progress
   */
  private reportProgress(): void {
    this.loadedAssets++;
    this.loadingProgress = (this.loadedAssets / this.totalAssets) * 100;
    
    if (this.onProgressCallback) {
      this.onProgressCallback(this.loadingProgress, this.loadedAssets, this.totalAssets);
    }
    
    console.log(`[AssetLoader] Progress: ${this.loadingProgress.toFixed(1)}% (${this.loadedAssets}/${this.totalAssets})`);
  }

  /**
   * Load all assets: localization, fonts, sounds, textures, atlases, Lottie, and Spine.
   * Returns a promise that resolves when everything is ready.
   */
  async loadAll(): Promise<{
    localization: ILocalizationData;
    fontsLoaded: boolean;
    soundsLoaded: boolean;
    assets: ILoadedAssets;
  }> {
    console.log('[AssetLoader] Starting asset loading...');
    
    // 1. Localization
    const localizationData = await this.localization.load();
    console.log('[AssetLoader] Localization loaded');

    // 2. Calculate total assets for progress tracking
    this.totalAssets = this.calculateTotalAssets();
    this.loadedAssets = 0;
    this.loadingProgress = 0;

    // 3. Parallel loading of all asset types
    const promises: Promise<any>[] = [];

    if (this.manifest) {
      // Fonts
      if (this.manifest.fonts && this.manifest.fonts.length > 0) {
        this.fontManager.register(this.manifest.fonts);
        promises.push(
          this.fontManager.load()
            .then(() => {
              this.loadedAssets += this.manifest!.fonts!.length;
              this.reportProgress();
            })
            .catch(err => console.warn('Fonts load error:', err))
        );
      }

      // Sounds
      if (this.manifest.sounds && this.manifest.sounds.length > 0) {
        this.soundManager.register(this.manifest.sounds);
        promises.push(
          this.soundManager.load()
            .then(() => {
              this.loadedAssets += this.manifest!.sounds!.length;
              this.reportProgress();
            })
            .catch(err => console.warn('Sounds load error:', err))
        );
      }

      // Individual textures
      if (this.manifest.textures && this.manifest.textures.length > 0 && this.engine) {
        promises.push(this.loadTextures(this.manifest.textures));
      }

      // Atlases
      if (this.manifest.atlases && this.manifest.atlases.length > 0 && this.engine) {
        promises.push(this.loadAtlases(this.manifest.atlases));
      }

      // Lottie animations
      if (this.manifest.lottie && this.manifest.lottie.length > 0) {
        promises.push(this.loadLottie(this.manifest.lottie));
      }

      // Spine animations
      if (this.manifest.spine && this.manifest.spine.length > 0) {
        promises.push(this.loadSpine(this.manifest.spine));
      }

      // Custom assets
      if (this.manifest.custom && this.manifest.custom.length > 0 && this.engine) {
        promises.push(this.loadCustom(this.manifest.custom));
      }
    }

    await Promise.all(promises);

    this.loaded = true;
    console.log('[AssetLoader] All assets loaded successfully!');

    return {
      localization: localizationData,
      fontsLoaded: this.fontManager.isLoaded(),
      soundsLoaded: true,
      assets: {
        textures: this.textures,
        sprites: this.sprites,
        lottieAnimations: this.lottieAnimations,
        spineSkeletons: this.spineSkeletons,
        customAssets: this.customAssets,
      },
    };
  }

  /**
   * Load individual texture images
   */
  private async loadTextures(textures: (string | ITextureConfig)[]): Promise<void> {
    if (!this.engine) throw new Error('Engine not set');
    
    console.log(`[AssetLoader] Loading ${textures.length} individual textures...`);
    
    const loadPromises = textures.map(async (tex) => {
      try {
        const config: ITextureConfig = typeof tex === 'string' 
          ? { key: tex.split('/').pop()!.replace(/\.[^/.]+$/, ''), url: tex }
          : tex;
        
        const texture = await this.engine!.resourceManager.load<Texture2D>({
          url: config.url,
          type: 'image',
        });
        
        this.textures.set(config.key, texture);
        console.log(`[AssetLoader] Loaded texture: ${config.key}`);
        this.reportProgress();
        
        // If frame is specified, create a sprite with that frame
        if (config.frame && texture) {
          const sprite = new Sprite(this.engine!, texture);
          this.sprites.set(`${config.key}_frame`, sprite);
        }
      } catch (error) {
        console.error(`[AssetLoader] Failed to load texture:`, tex, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Load texture atlases (spritesheets)
   * Supports multiple formats: TexturePacker, FreeType, custom
   */
  private async loadAtlases(atlases: IAtlasConfig[]): Promise<void> {
    if (!this.engine) throw new Error('Engine not set');
    
    console.log(`[AssetLoader] Loading ${atlases.length} atlases...`);
    
    const loadPromises = atlases.map(async (atlas) => {
      try {
        // Load the JSON metadata first
        const jsonResponse = await fetch(atlas.jsonUrl);
        const atlasData = await jsonResponse.json();
        
        // Load the texture image
        const texture = await this.engine!.resourceManager.load<Texture2D>({
          url: atlas.imageUrl,
          type: 'image',
        });
        
        this.textures.set(atlas.name, texture);
        console.log(`[AssetLoader] Loaded atlas texture: ${atlas.name}`);
        this.reportProgress();
        
        // Parse atlas frames based on format
        const frames = this.parseAtlasData(atlasData, atlas.format || 'auto');
        
        // Create sprites for each frame
        frames.forEach((frame: any) => {
          const sprite = new Sprite(this.engine!, texture);
          this.sprites.set(`${atlas.name}/${frame.name}`, sprite);
        });
        
        console.log(`[AssetLoader] Created ${frames.length} sprites from atlas: ${atlas.name}`);
        this.reportProgress();
        
      } catch (error) {
        console.error(`[AssetLoader] Failed to load atlas:`, atlas.name, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Parse atlas data based on format
   */
  private parseAtlasData(data: any, format: 'texturepacker' | 'freetype' | 'custom' | 'auto'): any[] {
    if (format === 'auto') {
      if (data.frames && Object.keys(data.frames).length > 0) {
        format = 'texturepacker';
      } else if (data.meta && data.meta.image) {
        format = 'freetype';
      } else {
        format = 'custom';
      }
    }
    
    switch (format) {
      case 'texturepacker':
        return Object.entries(data.frames).map(([name, frame]: [string, any]) => ({
          name,
          frame: frame.frame,
          rotated: frame.rotated || false,
          trimmed: frame.trimmed || false,
          sourceSize: frame.sourceSize,
          spriteSourceSize: frame.spriteSourceSize,
        }));
        
      case 'freetype':
        return Object.entries(data.frames || {}).map(([name, frame]: [string, any]) => ({
          name,
          frame: frame.frame || frame,
        }));
        
      case 'custom':
      default:
        return Array.isArray(data.frames) ? data.frames : [data];
    }
  }

  /**
   * Load Lottie animations
   */
  private async loadLottie(lotties: ILottieConfig[]): Promise<void> {
    console.log(`[AssetLoader] Loading ${lotties.length} Lottie animations...`);
    
    const loadPromises = lotties.map(async (lottie) => {
      try {
        const response = await fetch(lottie.url);
        const lottieData = await response.json();
        
        this.lottieAnimations.set(lottie.key, lottieData);
        console.log(`[AssetLoader] Loaded Lottie: ${lottie.key}`);
        this.reportProgress();
        
      } catch (error) {
        console.error(`[AssetLoader] Failed to load Lottie:`, lottie.key, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Load Spine skeletons
   */
  private async loadSpine(spines: ISpineConfig[]): Promise<void> {
    console.log(`[AssetLoader] Loading ${spines.length} Spine skeletons...`);
    
    const loadPromises = spines.map(async (spine) => {
      try {
        const skeletonResponse = await fetch(spine.skeletonUrl);
        const skeletonData = await skeletonResponse.json();
        
        const atlasResponse = await fetch(spine.atlasUrl);
        const atlasData = await atlasResponse.text();
        
        const texturePromises = spine.textureUrls.map(url => 
          this.engine?.resourceManager.load<Texture2D>({ url, type: 'image' })
        );
        const textures = await Promise.all(texturePromises);
        
        this.spineSkeletons.set(spine.key, {
          skeleton: skeletonData,
          atlas: atlasData,
          textures,
        });
        
        console.log(`[AssetLoader] Loaded Spine: ${spine.key}`);
        this.reportProgress();
        
      } catch (error) {
        console.error(`[AssetLoader] Failed to load Spine:`, spine.key, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Load custom assets
   */
  private async loadCustom(custom: Array<{key: string, url: string, type: string}>): Promise<void> {
    if (!this.engine) throw new Error('Engine not set');
    
    console.log(`[AssetLoader] Loading ${custom.length} custom assets...`);
    
    const loadPromises = custom.map(async (asset) => {
      try {
        let loadedAsset: any;
        
        if (asset.type === 'image') {
          loadedAsset = await this.engine!.resourceManager.load<Texture2D>({
            url: asset.url,
            type: 'image',
          });
        } else if (asset.type === 'json') {
          const response = await fetch(asset.url);
          loadedAsset = await response.json();
        } else if (asset.type === 'text') {
          const response = await fetch(asset.url);
          loadedAsset = await response.text();
        } else {
          loadedAsset = await this.engine!.resourceManager.load({
            url: asset.url,
          });
        }
        
        this.customAssets.set(asset.key, loadedAsset);
        console.log(`[AssetLoader] Loaded custom asset: ${asset.key} (${asset.type})`);
        this.reportProgress();
        
      } catch (error) {
        console.error(`[AssetLoader] Failed to load custom asset:`, asset.key, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Get a texture by key.
   */
  getTexture(key: string): Texture2D | undefined {
    return this.textures.get(key);
  }

  /**
   * Get a sprite by key (from atlas or individual).
   */
  getSprite(key: string): Sprite | undefined {
    return this.sprites.get(key);
  }

  /**
   * Get a Lottie animation by key.
   */
  getLottie(key: string): any {
    return this.lottieAnimations.get(key);
  }

  /**
   * Get a Spine skeleton by key.
   */
  getSpine(key: string): any {
    return this.spineSkeletons.get(key);
  }

  /**
   * Get a custom asset by key.
   */
  getCustom(key: string): any {
    return this.customAssets.get(key);
  }

  /**
   * Get all loaded textures.
   */
  getAllTextures(): Map<string, Texture2D> {
    return new Map(this.textures);
  }

  /**
   * Get all loaded sprites.
   */
  getAllSprites(): Map<string, Sprite> {
    return new Map(this.sprites);
  }

  /**
   * Get the localization service.
   */
  getLocalization(): LocalizationService {
    return this.localization;
  }

  /**
   * Get the font manager.
   */
  getFontManager(): FontManager {
    return this.fontManager;
  }

  /**
   * Get the sound manager.
   */
  getSoundManager(): SoundManager {
    return this.soundManager;
  }

  /**
   * Check if all assets are loaded.
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get current loading progress (0-100).
   */
  getProgress(): number {
    return this.loadingProgress;
  }

  /**
   * Clear all loaded assets (useful for theme switching).
   */
  clear(): void {
    this.textures.clear();
    this.sprites.clear();
    this.lottieAnimations.clear();
    this.spineSkeletons.clear();
    this.customAssets.clear();
    this.loaded = false;
    this.loadingProgress = 0;
    this.loadedAssets = 0;
    this.totalAssets = 0;
  }
}
