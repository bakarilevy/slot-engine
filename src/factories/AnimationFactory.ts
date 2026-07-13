/**
 * AnimationFactory - Helper class for creating Lottie and Spine animations.
 * Provides a simple API for instantiating animated elements in the slot game.
 */

import { GCContainer, GCLottie, GCSpine } from '../types/GalaceanTypes';
import { ILottieConfig, ISpineConfig } from '../types';

export class AnimationFactory {
  /**
   * Create a Lottie animation instance
   * @param parent - Parent container to attach the animation to
   * @param config - Lottie configuration
   * @param name - Optional name for the animation entity
   * @returns Promise resolving to the GCLottie instance
   */
  static async createLottie(
    parent: GCContainer,
    config: ILottieConfig,
    name: string = 'LottieAnimation'
  ): Promise<GCLottie> {
    const lottie = new GCLottie(parent, name);
    
    try {
      // Load the animation
      await lottie.loadAnimation(config.jsonUrl, config.width, config.height || config.width);
      
      // Apply configuration
      if (config.alpha !== undefined) {
        lottie.alpha = config.alpha;
      }
      
      if (config.speed !== undefined) {
        lottie.setSpeed(config.speed);
      }
      
      // Auto-play if requested
      if (config.autoPlay !== false) {
        lottie.play(config.loop || false);
      }
      
      return lottie;
    } catch (error) {
      console.error('Failed to create Lottie animation:', error);
      throw error;
    }
  }
  
  /**
   * Create a Spine skeletal animation instance
   * @param parent - Parent container to attach the skeleton to
   * @param config - Spine configuration
   * @param name - Optional name for the skeleton entity
   * @returns Promise resolving to the GCSpine instance
   */
  static async createSpine(
    parent: GCContainer,
    config: ISpineConfig,
    name: string = 'SpineSkeleton'
  ): Promise<GCSpine> {
    const spine = new GCSpine(parent, name);
    
    try {
      // Load the skeleton
      await spine.loadSkeleton(
        config.atlasUrl,
        config.skeletonUrl,
        config.imageUrl
      );
      
      // Apply skin if specified
      if (config.skin) {
        spine.setSkin(config.skin);
      }
      
      // Apply color tint if specified
      if (config.color !== undefined) {
        spine.setColor(config.color);
      }
      
      // Apply opacity
      if (config.alpha !== undefined) {
        spine.alpha = config.alpha;
      }
      
      // Apply speed
      if (config.speed !== undefined) {
        spine.setSpeed(config.speed);
      }
      
      // Set default animation
      const defaultAnim = config.defaultAnimation || spine.getCurrentAnimation();
      if (defaultAnim) {
        spine.setAnimation(defaultAnim, config.loop !== false);
      }
      
      // Auto-play if requested
      if (config.autoPlay !== false) {
        spine.play();
      }
      
      return spine;
    } catch (error) {
      console.error('Failed to create Spine animation:', error);
      throw error;
    }
  }
  
  /**
   * Create multiple Lottie animations in parallel
   * @param parent - Parent container
   * @param configs - Array of Lottie configurations
   * @returns Promise resolving to array of GCLottie instances
   */
  static async createLotties(
    parent: GCContainer,
    configs: Array<{ config: ILottieConfig; name?: string }>
  ): Promise<GCLottie[]> {
    return Promise.all(
      configs.map(({ config, name }) => this.createLottie(parent, config, name))
    );
  }
  
  /**
   * Create multiple Spine animations in parallel
   * @param parent - Parent container
   * @param configs - Array of Spine configurations
   * @returns Promise resolving to array of GCSpine instances
   */
  static async createSpines(
    parent: GCContainer,
    configs: Array<{ config: ISpineConfig; name?: string }>
  ): Promise<GCSpine[]> {
    return Promise.all(
      configs.map(({ config, name }) => this.createSpine(parent, config, name))
    );
  }
  
  /**
   * Create a coin shower effect using Lottie
   * Useful for big wins and jackpots
   * @param parent - Parent container
   * @param jsonUrl - URL to coin shower Lottie JSON
   * @returns Promise resolving to the GCLottie instance
   */
  static async createCoinShower(
    parent: GCContainer,
    jsonUrl: string
  ): Promise<GCLottie> {
    return this.createLottie(parent, {
      jsonUrl,
      width: 800,
      height: 600,
      loop: true,
      autoPlay: true,
      alpha: 1.0
    }, 'CoinShower');
  }
  
  /**
   * Create a sparkle effect using Lottie
   * Useful for win celebrations
   * @param parent - Parent container
   * @param jsonUrl - URL to sparkle Lottie JSON
   * @returns Promise resolving to the GCLottie instance
   */
  static async createSparkles(
    parent: GCContainer,
    jsonUrl: string
  ): Promise<GCLottie> {
    return this.createLottie(parent, {
      jsonUrl,
      width: 400,
      height: 400,
      loop: false,
      autoPlay: true,
      alpha: 1.0
    }, 'Sparkles');
  }
  
  /**
   * Create an animated character using Spine
   * Useful for bonus games or mascot characters
   * @param parent - Parent container
   * @param atlasUrl - URL to Spine atlas
   * @param skeletonUrl - URL to Spine skeleton JSON
   * @param animationName - Name of the idle animation
   * @returns Promise resolving to the GCSpine instance
   */
  static async createCharacter(
    parent: GCContainer,
    atlasUrl: string,
    skeletonUrl: string,
    animationName: string = 'idle'
  ): Promise<GCSpine> {
    return this.createSpine(parent, {
      atlasUrl,
      skeletonUrl,
      defaultAnimation: animationName,
      loop: true,
      autoPlay: true
    }, 'Character');
  }
}
