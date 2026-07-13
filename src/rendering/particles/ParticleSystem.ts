import { Texture2D } from '@galacean/engine';
import { Particle } from './Particle.js';
import { GCContainer, GCTween } from '../../types/GalaceanTypes.js';

export interface IParticleSystemConfig {
  /** Number of particles in the pool */
  count: number;
  /** Texture key or Texture2D to use for all particles */
  texture: string | Texture2D;
  /** Parent container to add particles to */
  parent: GCContainer;
}

/**
 * Base class for particle systems.
 * Manages a pool of particles, updates them on the game loop, and handles resize.
 */
export abstract class ParticleSystem {
  protected particles: Particle[] = [];
  protected container: GCContainer;
  protected texture: Texture2D;
  protected config: IParticleSystemConfig;
  protected running: boolean = false;
  protected scale: number = 1;
  private animationFrameId: number | null = null;

  constructor(config: IParticleSystemConfig) {
    this.config = config;
    this.container = config.parent;

    // Resolve texture - will be set by subclasses through Renderer
    if (typeof config.texture === 'string') {
      throw new Error(`[ParticleSystem] Texture must be resolved before use: ${config.texture}`);
    } else {
      this.texture = config.texture;
    }

    // Create particles
    for (let i = 0; i < config.count; i++) {
      const particle = new Particle(this.container, this.texture);
      this.particles.push(particle);
    }
  }

  /**
   * Start the particle system (starts animation loop).
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.animate();
  }

  /**
   * Stop the particle system (stops animation loop).
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = () => {
    if (!this.running) return;
    
    // Use a fixed delta time (assuming 60fps)
    const delta = 1 / 60;
    this.update(delta);
    
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Reset all particles (e.g., on resize or restart).
   */
  abstract reset(): void;

  /**
   * Update all particles.
   * @param delta - Delta time in seconds.
   */
  protected update(delta: number): void {
    if (!this.running) return;
    for (const p of this.particles) {
      if (p.active) {
        p.update(delta * this.scale);
      }
    }
  }

  /**
   * Set the scale factor (for responsive design).
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.container.scale = { x: scale, y: scale, z: 1 };
  }

  /**
   * Get the container (for positioning).
   */
  getContainer(): GCContainer {
    return this.container;
  }

  /**
   * Destroy the system and clean up.
   */
  destroy(): void {
    this.stop();
    this.container.destroy();
    this.particles = [];
  }
}
