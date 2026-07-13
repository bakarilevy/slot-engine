import { GCContainer, GCSprite, GCGraphics, GCTween, GCTimeline } from '../types/GalaceanTypes.js';
import { UIFactory } from './UIFactory.js';
import {
  type IPaylinePattern,
  type IWinLineResult,
  type IPaylineRendererConfig,
} from '../types/index.js';

export class PaylineRenderer {
  private container: GCContainer;
  private graphics: GCGraphics;
  private config: Required<IPaylineRendererConfig>;
  private linePatterns: IPaylinePattern[];
  private reelWidth: number;
  private reelHeight: number;
  private symbolWidth: number;
  private symbolHeight: number;
  private reelXOffsets: number[];
  private rowYOffsets: number[];
  private scale: number = 1;

  // Animation tracking
  private activeTweens: Array<{ kill: () => void }> = [];
  private isVisible: boolean = false;

  constructor(
    parent: GCContainer,
    linePatterns: IPaylinePattern[],
    config: IPaylineRendererConfig = {}
  ) {
    this.linePatterns = linePatterns;

    this.config = {
      color: config.color ?? 0xffd700,
      alpha: config.alpha ?? 0.8,
      lineWidth: config.lineWidth ?? 3,
      glowWidth: config.glowWidth ?? 2,
      glowColor: config.glowColor ?? 0xffd700,
      glowAlpha: config.glowAlpha ?? 0.3,
      drawDuration: config.drawDuration ?? 0.5,
      ease: config.ease ?? 'power2.out',
      pulse: config.pulse ?? true,
      pulseDuration: config.pulseDuration ?? 0.8,
    };

    // Create container
    this.container = UIFactory.createContainer(parent);

    // Create graphics object for drawing
    this.graphics = UIFactory.createGraphics(this.container);
    this.graphics.visible = false;

    // Default dimensions (will be set on first draw)
    this.reelWidth = 0;
    this.reelHeight = 0;
    this.symbolWidth = 0;
    this.symbolHeight = 0;
    this.reelXOffsets = [];
    this.rowYOffsets = [];
  }

  setLinePatterns(patterns: IPaylinePattern[]): void {
    this.linePatterns = patterns;
  }

  /**
   * Set the dimensions and positions of the reels.
   * Must be called before drawing.
   */
  setReelDimensions(
    reelWidth: number,
    reelHeight: number,
    symbolWidth: number,
    symbolHeight: number,
    reelXOffsets: number[],
    rowYOffsets: number[]
  ): void {
    this.reelWidth = reelWidth;
    this.reelHeight = reelHeight;
    this.symbolWidth = symbolWidth;
    this.symbolHeight = symbolHeight;
    this.reelXOffsets = reelXOffsets;
    this.rowYOffsets = rowYOffsets;
  }

  /**
   * Set the scale factor (for responsive design).
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.container.setScale(scale, scale);
  }

  /**
   * Draw and animate winning lines.
   * @param winLines - Array of winning lines to draw.
   * @param onComplete - Callback when all animations complete.
   */
  drawWinLines(winLines: IWinLineResult[], onComplete?: () => void): void {
    // Clear previous lines
    this.clearLines();

    if (!winLines || winLines.length === 0) {
      this.graphics.visible = false;
      if (onComplete) onComplete();
      return;
    }

    this.graphics.visible = true;
    this.isVisible = true;

    const color = this.config.color;
    const alpha = this.config.alpha;
    const lineWidth = this.config.lineWidth * this.scale;
    const glowWidth = this.config.glowWidth * this.scale;
    const drawDuration = this.config.drawDuration;
    const ease = this.config.ease;

    const tl = new GCTimeline({
      onComplete: () => {
        // Pulse effect if enabled
        if (this.config.pulse) {
          this.startPulse();
        }
        if (onComplete) onComplete();
      },
    });

    for (let i = 0; i < winLines.length; i++) {
      const winLine = winLines[i];
      const pattern = this.linePatterns[winLine.lineIndex];
      if (!pattern) {
        console.warn(`[PaylineRenderer] Pattern not found for line index ${winLine.lineIndex}`);
        continue;
      }

      // Build the path points (from the pattern)
      const points = pattern.map((pos, idx) => {
        const reelIdx = pos.reel;
        const rowIdx = pos.row;
        const x = this.reelXOffsets[reelIdx] ?? 0;
        const y = this.rowYOffsets[rowIdx] ?? 0;
        return { x, y, reelIdx, rowIdx };
      });

      const lineGraphics = UIFactory.createGraphics(this.container);

      // Draw the line
      this.drawLineOnGraphics(lineGraphics, points, color, alpha, lineWidth);

      // Draw glow
      if (glowWidth > 0) {
        const glowGraphics = UIFactory.createGraphics(this.container);
        this.drawLineOnGraphics(
          glowGraphics,
          points,
          this.config.glowColor,
          this.config.glowAlpha,
          lineWidth + glowWidth * 2
        );
        glowGraphics.alpha = 0;
        // Add to timeline: fade in glow first
        const glowTween = GCTween.to(glowGraphics, {
          alpha: this.config.glowAlpha,
        }, {
          duration: drawDuration * 0.3,
          ease: ease,
        });
        tl.add(glowTween, i * 0.1);
        // Store for cleanup
        this.activeTweens.push(glowTween);
        // We'll store the graphics for cleanup
        (lineGraphics as any)._glow = glowGraphics;
      }

      // Fade in the line
      lineGraphics.alpha = 0;
      const lineTween = GCTween.to(lineGraphics, {
        alpha: alpha,
      }, {
        duration: drawDuration * 0.7,
        ease: ease,
      });
      tl.add(lineTween, i * 0.1 + drawDuration * 0.2);

      // Store for cleanup
      this.activeTweens.push(lineTween);
      (lineGraphics as any)._lineData = { winLine, points };

      // Add a small dot at each position (optional)
      for (const pt of points) {
        const dot = UIFactory.createGraphics(this.container);
        dot.beginFill(color, 0.5);
        dot.drawCircle(pt.x, pt.y, 6 * this.scale);
        dot.endFill();
        dot.alpha = 0;
        const dotTween = GCTween.to(dot, {
          alpha: 0.8,
        }, {
          duration: drawDuration * 0.4,
          ease: ease,
        });
        tl.add(dotTween, i * 0.1 + drawDuration * 0.3);
        (dot as any)._lineData = { winLine };
        this.activeTweens.push(dotTween);
      }
    }
    
    tl.play();
  }

  /**
   * Clear all drawn lines and stop animations.
   */
  clearLines(): void {
    // Kill all tweens
    for (const tween of this.activeTweens) {
      tween.kill();
    }
    this.activeTweens = [];

    // Remove all children except the main graphics (keep it for reuse)
    const children = (this.container as any).getChildren?.() || [];
    for (const child of children) {
      if (child === this.graphics) continue;
      (child as any).destroy?.();
    }

    // Clear the main graphics
    this.graphics.clear();
    this.graphics.visible = false;
    this.isVisible = false;
  }

  /**
   * Set the style configuration (color, width, etc.).
   */
  setConfig(config: Partial<IPaylineRendererConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the container for positioning.
   */
  getContainer(): GCContainer {
    return this.container;
  }

  /**
   * Destroy the renderer and clean up.
   */
  destroy(): void {
    this.clearLines();
    this.graphics.destroy();
    this.container.destroy();
  }

  // --- Private methods ---

  private drawLineOnGraphics(
    graphics: GCGraphics,
    points: { x: number; y: number; reelIdx: number; rowIdx: number }[],
    color: number,
    alpha: number,
    lineWidth: number
  ): void {
    if (points.length < 2) return;

    graphics.clear();
    graphics.lineStyle(lineWidth, color, alpha);
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    // Add small circle at each point for emphasis
    for (const pt of points) {
      graphics.beginFill(color, alpha * 0.4);
      graphics.drawCircle(pt.x, pt.y, lineWidth * 1.5);
      graphics.endFill();
    }
  }

  private startPulse(): void {
    // Simple pulse: alternate alpha of all line graphics
    const lineChildren = (this.container as any).getChildren?.().filter(
      (child: any) => child instanceof GCGraphics && child !== this.graphics
    ) || [];
    if (lineChildren.length === 0) return;

    const pulseDuration = this.config.pulseDuration;

    // Create a repeating pulse
    const pulse = () => {
      if (!this.isVisible) {
        // If hidden, stop pulsing
        return;
      }
      // Tween alpha of each child
      lineChildren.forEach((c: any) => {
        GCTween.to(c, { alpha: 0.6 }, {
          duration: pulseDuration * 0.5,
          ease: 'sine.inOut',
          onComplete: () => {
            if (!this.isVisible) return;
            GCTween.to(c, { alpha: 1.0 }, {
              duration: pulseDuration * 0.5,
              ease: 'sine.inOut',
              onComplete: pulse,
            });
          },
        });
      });
    };

    // Start pulse after a short delay
    this.activeTweens.push(
      GCTween.delayedCall(0.2, pulse)
    );
  }
}
