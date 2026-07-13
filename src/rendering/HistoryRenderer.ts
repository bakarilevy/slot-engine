import { GCContainer, GCSprite, GCText, GCGraphics } from '../types/GalaceanTypes.js';
import { UIFactory } from './UIFactory.js';
import { GameEvents } from '../events/GameEvents.js';
import { LocalizationService } from '../assets/LocalizationService.js';
import { type SymbolMap } from '../types/index.js';

export interface IHistoryEntry {
  time: string;
  bet: number;
  win: number;
  balance: number;
  result: number[][]; // reel symbols
}

export class HistoryRenderer {
  private container: GCContainer;
  private entriesContainer: GCContainer;
  private events: GameEvents;
  private localization: LocalizationService;
  private symbolMap: SymbolMap;
  private scale: number = 1;
  private historyData: IHistoryEntry[] = [];
  private visible: boolean = false;
  private cleanupListeners: (() => void)[] = [];

  constructor(
    parent: GCContainer,
    events: GameEvents,
    localization: LocalizationService,
    symbolMap: SymbolMap
  ) {
    this.events = events;
    this.localization = localization;
    this.symbolMap = symbolMap;

    // Main container (hidden by default)
    this.container = UIFactory.createContainer(parent);
    this.container.visible = false;

    // Background
    const bg = UIFactory.createRoundedRect(700, 600, 20, 0x1a1a2e, 0x444466, 2, this.container);
    bg.alpha = 0.95;

    // Title
    const title = UIFactory.createText(
      this.localization.get('history_title', true),
      {
        fontSize: 28,
        fontFamily: 'Arial',
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
      this.container
    );
    title.x = 0;
    title.y = -260;

    // Close button
    const closeBtn = UIFactory.createText('\u2715', {
      fontSize: 30,
      fontFamily: 'Arial',
      fill: '#ffffff',
      align: 'center',
    }, this.container);
    closeBtn.x = 320;
    closeBtn.y = -270;
    closeBtn.interactive = true;
    closeBtn.on('pointerdown', () => {
      this.hide();
    });

    // Entries container (scrollable area)
    this.entriesContainer = UIFactory.createContainer(this.container);
    this.entriesContainer.y = -200;

    // Mask for entries
    const mask = UIFactory.createRect(600, 380, 0xffffff, undefined, 0, this.entriesContainer);
    mask.x = 0;
    mask.y = 0;
    this.entriesContainer.mask = mask;

    // Listen to events
    this.wireEvents();
  }

  /**
   * Add a history entry and re-render.
   */
  addEntry(entry: IHistoryEntry): void {
    this.historyData.unshift(entry);
    if (this.historyData.length > 50) {
      this.historyData.pop();
    }
    this.renderEntries();
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.historyData = [];
    this.renderEntries();
  }

  /**
   * Show the history panel.
   */
  show(): void {
    this.visible = true;
    this.container.visible = true;
    this.renderEntries();
  }

  /**
   * Hide the history panel.
   */
  hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  /**
   * Toggle visibility.
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set the scale factor.
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.container.scale.set(scale, scale);
  }

  /**
   * Get the container.
   */
  getContainer(): GCContainer {
    return this.container;
  }

  /**
   * Destroy the renderer.
   */
  destroy(): void {
    for (const cleanup of this.cleanupListeners) {
      cleanup();
    }
    this.cleanupListeners = [];
    this.container.destroy();
  }

  private wireEvents(): void {
    const historyCleanup = this.events.on('game:history:add', (entry: IHistoryEntry) => {
      this.addEntry(entry);
    });
    this.cleanupListeners.push(historyCleanup);

    const clearCleanup = this.events.on('game:history:clear', () => {
      this.clear();
    });
    this.cleanupListeners.push(clearCleanup);

    const toggleCleanup = this.events.on('ui:history:toggle', () => {
      this.toggle();
    });
    this.cleanupListeners.push(toggleCleanup);
  }

  private renderEntries(): void {
    // Clear existing entries
    const children = this.entriesContainer.children.slice();
    for (const child of children) {
      if ((child as any)._isEntry) {
        (child as any).destroy?.();
      }
    }

    // Render up to 10 most recent entries
    const maxVisible = 10;
    const entriesToShow = this.historyData.slice(0, maxVisible);

    let yOffset = 0;
    for (let i = 0; i < entriesToShow.length; i++) {
      const entry = entriesToShow[i]!;
      const rowContainer = UIFactory.createContainer(this.entriesContainer);
      (rowContainer as any)._isEntry = true;
      rowContainer.y = yOffset;

      // Time
      const timeText = UIFactory.createText(entry.time, {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#aaaaaa',
      }, rowContainer);
      timeText.x = -280;
      timeText.y = 0;

      // Bet
      const betText = UIFactory.createText(`Bet: ${entry.bet.toFixed(2)}`, {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#ffffff',
      }, rowContainer);
      betText.x = -150;
      betText.y = 0;

      // Win (highlight if > 0)
      const winColor = entry.win > 0 ? '#00ff88' : '#666666';
      const winText = UIFactory.createText(`Win: ${entry.win.toFixed(2)}`, {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: winColor,
        fontWeight: entry.win > 0 ? 'bold' : 'normal',
      }, rowContainer);
      winText.x = 0;
      winText.y = 0;

      // Balance
      const balanceText = UIFactory.createText(`Balance: ${entry.balance.toFixed(2)}`, {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#ffd700',
      }, rowContainer);
      balanceText.x = 150;
      balanceText.y = 0;

      // Result symbols (small icons)
      this.renderResultSymbols(rowContainer, entry.result);

      // Separator line
      if (i < entriesToShow.length - 1) {
        const separator = UIFactory.createRect(600, 1, 0x333333, undefined, 0, rowContainer);
        separator.y = 35;
        separator.x = 0;
      }

      yOffset += 50;
    }
  }

  private renderResultSymbols(container: GCContainer, result: number[][]): void {
    // Flatten result to array of symbol IDs per reel
    const reelCount = result.length;
    if (reelCount === 0) return;

    const symbolWidth = 20;
    const startX = 250;
    const centerY = 0;

    for (let reelIdx = 0; reelIdx < reelCount; reelIdx++) {
      const reelSymbols = result[reelIdx]!;
      const x = startX + reelIdx * symbolWidth;
      
      // Show middle symbol (simplified)
      const middleRow = Math.floor(reelSymbols.length / 2);
      const symbolId = reelSymbols[middleRow];
      if (symbolId !== undefined) {
        const textureKey = this.symbolMap[symbolId];
        if (textureKey) {
          const sprite = UIFactory.createSprite(textureKey, {
            anchor: { x: 0.5, y: 0.5 },
            scale: { x: 0.3, y: 0.3 },
          }, container);
          sprite.x = x;
          sprite.y = centerY;
        }
      }
    }
  }
}
