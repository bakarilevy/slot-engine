import { Entity, Script, AudioSource, WebGLEngine } from '@galacean/engine';
import { type ISoundConfig, type ISoundState } from '../types/index.js';

export class SoundManager {
  private engine: WebGLEngine | null = null;
  private audioSources: Map<string, { entity: Entity; source: AudioSource; config: ISoundConfig }> = new Map();
  private configs: ISoundConfig[] = [];
  private state: ISoundState = {
    musicEnabled: true,
    sfxEnabled: true,
    currentMusicId: null,
  };

  constructor() {
    // Galacean Engine handles audio context automatically
  }

  /**
   * Initialize the sound manager with a Galacean engine instance.
   */
  initialize(engine: WebGLEngine): void {
    this.engine = engine;
  }

  /**
   * Register sound configurations.
   */
  register(sounds: ISoundConfig[]): void {
    this.configs = sounds;
  }

  /**
   * Load all registered sounds using Galacean's resource manager.
   * Returns a promise that resolves when all sounds are loaded.
   */
  async load(): Promise<void> {
    if (!this.engine) {
      throw new Error('[SoundManager] Engine not initialized. Call initialize() first.');
    }

    const loadPromises: Promise<void>[] = [];

    for (const cfg of this.configs) {
      const promise = new Promise<void>((resolve, reject) => {
        // Create entity for this sound using createRootEntity
        const entity = this.engine!.sceneManager.activeScene.createRootEntity(`Audio_${cfg.id}`);
        const audioSource = entity.addComponent(AudioSource);
        
        // Configure basic properties
        audioSource.loop = cfg.loop || false;
        audioSource.volume = cfg.volume || 1.0;
        audioSource.playOnEnabled = false;

        // Load the audio clip
        this.engine!.resourceManager
          .load({
            url: `${cfg.src}.mp3`,
            type: 'audio' as any,
          })
          .then((clip: any) => {
            audioSource.clip = clip;
            this.audioSources.set(cfg.id, { entity, source: audioSource, config: cfg });
            resolve();
          })
          .catch((error) => {
            console.warn(`[SoundManager] Failed to load sound: ${cfg.id}`, error);
            entity.destroy();
            reject(error);
          });
      });
      loadPromises.push(promise);
    }

    try {
      await Promise.all(loadPromises);
      console.log('[SoundManager] All sounds loaded.');
    } catch (error) {
      console.error('[SoundManager] Some sounds failed to load:', error);
    }
  }

  /**
   * Play a sound by id.
   */
  play(id: string, fadeIn?: number): void {
    const audioData = this.audioSources.get(id);
    if (!audioData) {
      console.warn(`[SoundManager] Sound not found: ${id}`);
      return;
    }

    const { source, config } = audioData;

    // Check if muted by category
    if (config.music && !this.state.musicEnabled) return;
    if (!config.music && !this.state.sfxEnabled) return;

    // Track current music
    if (config.music) {
      this.state.currentMusicId = id;
    }

    if (fadeIn) {
      // Fade in effect
      source.volume = 0;
      source.play();
      const targetVolume = config.volume || 1.0;
      const steps = 20;
      const stepVolume = targetVolume / steps;
      const interval = fadeIn / steps;
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        source.volume = Math.min(stepVolume * currentStep, targetVolume);
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, interval);
    } else {
      source.play();
    }
  }

  /**
   * Stop a sound by id.
   */
  stop(id: string, fadeOut?: number): void {
    const audioData = this.audioSources.get(id);
    if (!audioData) return;

    const { source } = audioData;

    if (fadeOut) {
      // Fade out effect
      const startVolume = source.volume;
      const steps = 20;
      const stepVolume = startVolume / steps;
      const interval = fadeOut / steps;
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        source.volume = Math.max(startVolume - stepVolume * currentStep, 0);
        if (currentStep >= steps) {
          source.stop();
          clearInterval(fadeInterval);
        }
      }, interval);
    } else {
      source.stop();
    }
  }

  /**
   * Pause all active audio sources.
   */
  pauseAll(): void {
    for (const [, data] of this.audioSources) {
      if (data.source.isPlaying) {
        data.source.pause();
      }
    }
  }

  /**
   * Resume all paused audio sources.
   */
  resumeAll(): void {
    for (const [, data] of this.audioSources) {
      if (!data.source.isPlaying && data.source.clip) {
        data.source.play();
      }
    }
  }

  /**
   * Mute or unmute music category.
   */
  setMusicEnabled(enabled: boolean): void {
    this.state.musicEnabled = enabled;
    for (const [id, data] of this.audioSources) {
      if (data.config.music) {
        if (enabled) {
          if (!data.source.isPlaying && id === this.state.currentMusicId) {
            data.source.play();
          }
        } else {
          data.source.pause();
        }
      }
    }
  }

  /**
   * Mute or unmute SFX category.
   */
  setSfxEnabled(enabled: boolean): void {
    this.state.sfxEnabled = enabled;
    // SFX are typically short-lived, so we just update the state
    // Individual play() calls will check this state
  }

  /**
   * Set global volume for all audio sources.
   */
  setVolume(vol: number): void {
    const normalizedVol = Math.min(1, Math.max(0, vol));
    for (const [, data] of this.audioSources) {
      data.source.volume = normalizedVol * (data.config.volume || 1.0);
    }
  }

  /**
   * Get the current state replica safely.
   */
  getState(): ISoundState {
    return { ...this.state };
  }

  /**
   * Clean up all audio resources.
   */
  destroy(): void {
    for (const [, data] of this.audioSources) {
      data.entity.destroy();
    }
    this.audioSources.clear();
  }
}
