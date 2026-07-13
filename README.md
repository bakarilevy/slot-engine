# Slot Engine - Galacean Edition

A professional client-side slot machine framework built on the **Galacean Engine**. This library handles all rendering, animations, audio, and UI interactions while integrating with your server-side game logic.

## Features

- 🎨 **Unified Rendering**: Single engine for 2D sprites, text, particles, and effects
- 🎵 **Integrated Audio**: Built-in sound management with Galacean's AudioSource
- ✨ **Animation System**: GCTween and GCTimeline for smooth transitions
- 📦 **Asset Management**: Support for individual images, texture atlases, fonts, sounds, Lottie, and Spine animations
- 📱 **Responsive Design**: Automatic scaling for different screen sizes
- 🎰 **Complete Slot Mechanics**: Reels, paylines, win evaluations, bonus triggers
- 🛠️ **Developer Friendly**: TypeScript support, modular architecture, easy theming
- 🔌 **Platform Agnostic**: Bridge interface for casino platform integration

## Installation

```bash
npm install slot-engine
```

Or install dependencies manually:

```bash
npm install @galacean/engine @galacean/effects @galacean/engine-toolkit @galacean/engine-lottie @galacean/engine-spine fontfaceobserver
```

## Quick Start

### HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slot Game</title>
  <style>
    body { margin: 0; overflow: hidden; background: #0a0a1a; }
    #game-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### Basic Usage

```typescript
// main.ts
import {
  GameController,
  GameConfig,
  DefaultPlatformBridge,
  type IAssetManifest
} from 'slot-engine';

// 1. Define symbol mapping (ID -> texture key)
const symbolMap: Record<number, string> = {
  0: 'symbols/cherry',
  1: 'symbols/lemon',
  2: 'symbols/orange',
  3: 'symbols/plum',
  4: 'symbols/bell',
  5: 'symbols/bar',
  6: 'symbols/seven',
  7: 'symbols/wild',
  8: 'symbols/scatter',
};

// 2. Define paytable (symbolId -> {x3: payout, x4: payout, x5: payout})
const paytableData: Record<number, Record<string, number>> = {
  0: { x3: 5, x4: 15, x5: 50 },    // Cherry
  1: { x3: 10, x4: 30, x5: 100 },  // Lemon
  2: { x3: 15, x4: 45, x5: 150 },  // Orange
  3: { x3: 20, x4: 60, x5: 200 },  // Plum
  4: { x3: 25, x4: 75, x5: 250 },  // Bell
  5: { x3: 50, x4: 150, x5: 500 }, // Bar
  6: { x3: 100, x4: 300, x5: 1000 }, // Seven
  7: { x3: 200, x4: 500, x5: 2000 }, // Wild
  8: { x3: 50, x4: 100, x5: 500 },   // Scatter
};

// 3. Configure the game
const config = new GameConfig({
  apiBaseUrl: 'https://your-api.com',
  wsBaseUrl: 'wss://your-ws.com/game',
  gameId: 'classic-slots',
  mode: 'fun', // or 'real'
  locale: 'en',
  currencySymbol: '$',
  reelCount: 5,
  rowCount: 3,
  paylineCount: 20,
});

// 4. Define asset manifest
const assetManifest: IAssetManifest = {
  // Individual PNG files
  textures: [
    'assets/ui/btn_spin.png',
    'assets/ui/btn_autoplay.png',
    'assets/ui/btn_settings.png',
    'assets/symbols/cherry.png',
    'assets/symbols/lemon.png',
    // ... more symbols
  ],
  
  // OR use texture atlases (recommended for production)
  atlases: [
    {
      name: 'symbols',
      url: 'assets/atlas/symbols.json',
      imageUrl: 'assets/atlas/symbols.png',
    },
    {
      name: 'ui',
      url: 'assets/atlas/ui.json',
      imageUrl: 'assets/atlas/ui.png',
    },
  ],
  
  // Sound effects
  sounds: [
    { name: 'spin', url: 'assets/sounds/spin.mp3' },
    { name: 'stop', url: 'assets/sounds/stop.mp3' },
    { name: 'win', url: 'assets/sounds/win.mp3' },
    { name: 'big_win', url: 'assets/sounds/big_win.mp3' },
  ],
  
  // Custom fonts (optional)
  fonts: [
    { family: 'SlotFont', url: 'assets/fonts/slot-font.ttf' },
  ],
};

// 5. Initialize platform bridge (handles casino integration)
const platformBridge = new DefaultPlatformBridge();

// 6. Start the game
const container = document.getElementById('game-container')!;
const game = new GameController({
  config,
  container,
  platformBridge,
  assetManifest,
  symbolMap,
  paytableData,
});

// 7. Listen for events
game.on('spin_start', () => console.log('Spinning...'));
game.on('spin_result', (result) => console.log('Result:', result));
game.on('win', (winData) => console.log('Win!', winData));

// Expose for debugging (optional)
(window as any).game = game;
```

## Asset Management

### Individual Images vs. Texture Atlases

The library supports both approaches:

#### Option A: Individual PNG Files (Simple)
```typescript
const assetManifest: IAssetManifest = {
  textures: [
    'assets/symbols/cherry.png',
    'assets/symbols/lemon.png',
    'assets/ui/btn_spin.png',
  ],
};
```
**Pros:** Simple setup, easy to update single assets  
**Cons:** More HTTP requests, less efficient rendering

#### Option B: Texture Atlases (Recommended)
```typescript
const assetManifest: IAssetManifest = {
  atlases: [
    {
      name: 'symbols',  // Reference as 'symbols/cherry', 'symbols/lemon', etc.
      url: 'assets/atlas/symbols.json',
      imageUrl: 'assets/atlas/symbols.png',
    },
    {
      name: 'ui',  // Reference as 'ui/btn_spin', 'ui/btn_bet', etc.
      url: 'assets/atlas/ui.json',
      imageUrl: 'assets/atlas/ui.png',
    },
  ],
};
```
**Pros:** Better performance (batched draws), smaller file size, organized assets  
**Cons:** Requires atlas generation tool (TexturePacker, free alternatives available)

### Generating Texture Atlases

Use [TexturePacker](https://www.codeandweb.com/texturepacker) or similar tools:

1. Organize your PNG files in folders (e.g., `symbols/`, `ui/`)
2. Export as JSON (hash/array format) + PNG
3. The library will automatically parse the JSON and create sub-textures
4. Reference frames as `{atlasName}/{frameName}`

Example TexturePacker settings:
- Format: JSON (hash)
- Texture format: PNG
- Scale variants: @2x, @3x for retina displays

### Asset Loading Lifecycle

```typescript
// Assets are loaded automatically when GameController initializes
const game = new GameController({...});

// You can also manually control loading
await game.assetLoader.loadAll();

// Check if specific assets are loaded
const cherryTexture = game.assetLoader.getTexture('symbols/cherry');

// Load additional assets on demand (e.g., for bonus games)
await game.assetLoader.loadBonusAssets('free_spins_theme');
```

## Configuration Options

### GameConfig

```typescript
const config = new GameConfig({
  // Backend integration
  apiBaseUrl: 'https://api.casino.com',
  wsBaseUrl: 'wss://ws.casino.com',
  
  // Game identification
  gameId: 'book-of-ra',
  provider: 'YourStudio',
  
  // Session settings
  mode: 'fun', // 'fun' | 'real'
  locale: 'en', // ISO language code
  currencySymbol: '$',
  currencyCode: 'USD',
  
  // Game mechanics
  reelCount: 5,
  rowCount: 3,
  paylineCount: 20,
  defaultBet: 1.00,
  minBet: 0.20,
  maxBet: 100.00,
  
  // Performance
  enableParticles: true,
  enableSound: true,
  enableMusic: true,
});
```

## Advanced Usage

### Custom Themes

```typescript
// Define multiple themes
const themes = {
  egypt: {
    background: 'assets/themes/egypt/bg.jpg',
    reelFrame: 'assets/themes/egypt/frame.png',
    buttons: 'assets/themes/egypt/ui-atlas.json',
  },
  ocean: {
    background: 'assets/themes/ocean/bg.jpg',
    reelFrame: 'assets/themes/ocean/frame.png',
    buttons: 'assets/themes/ocean/ui-atlas.json',
  },
};

// Switch themes at runtime
game.setTheme('egypt');
```

### Event System

The library uses a centralized event bus (`GameEvents`) for decoupled communication between components.

#### Available Events

| Event | Data | Description |
|-------|------|-------------|
| `loading:start` | `{ phase: string }` | Asset loading begins |
| `loading:progress` | `{ progress: number, phase: string }` | Loading progress (0-1) |
| `loading:complete` | `{}` | All assets loaded |
| `game:ready` | `{ state: GameState }` | Game initialized and ready |
| `spin:start` | `{ bet: number }` | Spin initiated |
| `spin:end` | `{ result: ISpinResponse }` | Spin animation complete |
| `win` | `{ amount: number, lines: IWinLine[] }` | Win occurred |
| `bonus:trigger` | `{ spinsRemaining: number }` | Bonus game triggered |
| `bonus:update` | Bonus data | Bonus state updated |
| `bonus:end` | Bonus data | Bonus game ended |
| `connection:closed` | `{ code, reason }` | WebSocket disconnected |
| `connection:error` | Error event | WebSocket error |
| `ui:toggleSettings` | `{}` | Settings panel toggle |
| `ui:toggleHistory` | `{}` | History panel toggle |
| `ui:togglePaytable` | `{}` | Paytable toggle |
| `ui:toggleFullscreen` | `{}` | Fullscreen toggle request |
| `autoplay:start` | `IAutoplayConfig` | Autoplay started |
| `autoplay:stop` | `{}` | Autoplay stopped |
| `fastspin:toggle` | `{}` | Fast spin mode toggled |

```typescript
// Subscribe to events
const cleanup = game.getEvents().on('win', (data) => {
  console.log('Win amount:', data.amount);
  console.log('Winning lines:', data.lines);
});

// Unsubscribe when done
cleanup();

// Or use the shorthand (if exposed on GameController)
game.on('bonus:trigger', (data) => {
  console.log(`Bonus! ${data.spinsRemaining} free spins remaining`);
});
```

### Custom Animations

The library provides GCTween and GCTimeline for animations (Galacean's built-in tweening system):

```typescript
import { GCTween, GCTimeline } from 'slot-engine';

// Simple tween
GCTween.to(mySprite, { alpha: 0, y: -100 }, {
  duration: 1.0,
  ease: 'power2.out',
  onComplete: () => console.log('Done!'),
});

// Complex timeline
const timeline = new GCTimeline();
timeline
  .to(reel1, { y: 500 }, { duration: 0.5 })
  .to(reel2, { y: 500 }, { duration: 0.5 }, '-=0.3') // overlap
  .to(winPopup, { scale: 1.2 }, { duration: 0.3 })
  .play();
```

### Particle Systems

Create custom particle effects for wins, bonuses, and special events:

```typescript
import { BurstParticleSystem, FallingParticleSystem } from 'slot-engine';

// Burst effect for big wins
const burst = new BurstParticleSystem({
  count: 50,
  texture: 'particles/star',
  parent: game.getRenderer().getStage(),
  config: {
    speed: 200,
    spread: 360,
    gravity: 50,
    lifetime: 1.5,
  },
});
burst.start();

// Falling particles for bonus ambiance
const falling = new FallingParticleSystem({
  count: 30,
  texture: 'particles/sparkle',
  parent: game.getRenderer().getStage(),
});
falling.start();
```

### Autoplay & Fast Spin

Built-in autoplay manager with configurable stop conditions:

```typescript
// Configure autoplay
game.getEvents().emit('autoplay:start', {
  rounds: 20,           // Number of auto spins
  stopOnWin: 100,       // Stop if win >= 100
  stopOnBalanceBelow: 50, // Stop if balance drops below 50
  stopOnBonus: true,    // Stop when bonus triggered
  fastSpin: false,      // Enable fast spin mode
});

// Stop autoplay
game.getEvents().emit('autoplay:stop');

// Toggle fast spin (skips animations, faster reel spin)
game.getEvents().emit('fastspin:toggle');
```

### Platform Bridge Integration

Integrate with casino platforms by implementing the `IPlatformBridge` interface:

```typescript
import { type IPlatformBridge } from 'slot-engine';

class CasinoPlatformBridge implements IPlatformBridge {
  updateBalance(amount: number): void {
    // Update casino wallet display
    window.parent.postMessage({ type: 'BALANCE_UPDATE', amount }, '*');
  }

  showPopup(
    title: string,
    message: string,
    buttons: { label: string; action: () => void }[]
  ): void {
    // Use casino's native popup system
    casinoSDK.showModal(title, message, buttons);
  }

  closeGame(): void {
    casinoSDK.closeGame();
  }

  sendPostMessage(data: any): void {
    window.parent.postMessage(data, '*');
  }

  ready(): void {
    casinoSDK.gameReady();
  }
}

// Use your custom bridge
const platformBridge = new CasinoPlatformBridge();
const game = new GameController({ ..., platformBridge });
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          GameController                 │
│  (Main entry point, state management)   │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌───▼───┐  ┌──▼────┐
│Renderer│  │Asset  │  │ Sound │
│        │  │Loader │  │Manager│
└───┬───┘  └───┬───┘  └───────┘
    │          │
    │    ┌─────▼────────┐
    │    │ Galacean     │
    │    │ Engine       │
    │    │ (WebGL)      │
    │    └──────────────┘
    │
┌───▼────────────────────────┐
│ Rendering Components       │
│ - ReelRenderer             │
│ - PaylineRenderer          │
│ - UIFactory                │
│ - ParticleSystem           │
│ - WinPopup, BalanceDisplay │
└────────────────────────────┘
```

### Core Modules

| Module | Description | Key Classes |
|--------|-------------|-------------|
| **Controllers** | Game logic orchestration | `GameController`, `BonusController` |
| **Core** | Configuration & state | `GameConfig`, `GameState` |
| **Rendering** | Visual components | `Renderer`, `ReelRenderer`, `UIManager`, `PaylineRenderer`, particle systems |
| **Assets** | Asset loading & management | `AssetLoader`, `SoundManager`, `FontManager`, `LocalizationService` |
| **Network** | Server communication | `WebSocketClient`, `APIClient`, `MessageHandler` |
| **Platform** | Casino integration | `DefaultPlatformBridge`, `VisibilityManager`, `FullscreenManager` |
| **Features** | Game features | `AutoplayManager`, `FastSpinManager`, `SessionTimer`, `ScreenShake` |
| **Events** | Event bus | `GameEvents` |

### Component Lifecycle

1. **Initialization**: `GameController` constructor creates all sub-components
2. **Asset Loading**: `AssetLoader` loads textures, sounds, fonts, atlases
3. **WebSocket Connection**: Connects to game server for real-time communication
4. **Ready State**: Emits `game:ready` event when fully initialized
5. **Game Loop**: Handles spins, wins, bonuses via event-driven architecture
6. **Cleanup**: `destroy()` method cleans up all resources

### Data Flow

```
User Action → UI Event → GameController → WebSocket → Server
                      ↓
                  GameState Update
                      ↓
                  Renderer Updates ← Event Bus ← Server Response
```

## Server Integration

This library is **client-side only**. It expects a separate server-side library to handle:

- RNG (Random Number Generation)
- Game state validation
- Balance management
- Bonus game logic
- Regulatory compliance

### Typical Flow

1. Player clicks SPIN
2. Client sends bet amount to server via WebSocket
3. Server validates balance, generates outcome, deducts bet
4. Server sends result to client: `{ symbols: [...], wins: [...] }`
5. Client animates reels to match server result
6. Client displays wins, updates balance

### WebSocket Message Protocol

The library uses a simple JSON-based protocol:

```typescript
// Spin Request
{
  type: 'SPIN',
  data: {
    action: 'spin',
    stakePerLine: number,
    selectedLines: number,
    totalStake: number,
    game_mode: 0 | 1  // 0 = base game, 1 = free spins
  }
}

// Spin Response
{
  type: 'SPIN',
  data: {
    result: number[][],      // [reelIndex][rowIndex] symbol IDs
    totalWin: number,
    winLines: IWinLine[],
    bonusTriggered: boolean,
    freeSpinsRemaining: number
  }
}

// Bonus Actions
{
  type: 'BONUS',
  data: {
    action: 'accept' | 'decline' | 'pick',
    bonusId: string,
    ...payload
  }
}
```

See our companion server library: [slot-engine-server](https://github.com/your-org/slot-engine-server)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires WebGL 2.0 support.

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Run examples (if available)
npm run dev

# Run tests (if available)
npm test
```

### Build Output

The library is built with `tsup` and outputs:

- `dist/index.js` - CommonJS bundle
- `dist/index.mjs` - ES Module bundle  
- `dist/index.d.ts` - TypeScript declarations

### Project Structure

```
src/
├── assets/          # Asset loading & management
│   ├── AssetLoader.ts
│   ├── SoundManager.ts
│   ├── FontManager.ts
│   └── LocalizationService.ts
├── controllers/     # Main game controllers
│   ├── GameController.ts
│   └── BonusController.ts
├── core/            # Core configuration & state
│   ├── GameConfig.ts
│   └── GameState.ts
├── effects/         # Visual effects (Galacean Effects integration)
├── events/          # Event bus system
│   └── GameEvents.ts
├── factories/       # Animation & object factories
├── features/        # Game features
│   ├── AutoplayManager.ts
│   ├── FastSpinManager.ts
│   ├── SessionTimer.ts
│   └── ScreenShake.ts
├── network/         # Network communication
│   ├── WebSocketClient.ts
│   ├── APIClient.ts
│   └── MessageHandler.ts
├── platform/        # Platform integration
│   ├── PlatformBridge.ts
│   ├── VisbilityManager.ts
│   └── FullscreenManager.ts
├── rendering/       # Visual components
│   ├── Renderer.ts
│   ├── ReelRenderer.ts
│   ├── UIManager.ts
│   ├── PaylineRenderer.ts
│   ├── particles/   # Particle systems
│   └── ...
├── services/        # Game services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## API Reference

### GameController

The main entry point for the slot engine.

#### Constructor Options

```typescript
interface IGameControllerOptions {
  config: GameConfig;              // Game configuration
  container: HTMLElement;          // DOM element to render into
  platformBridge: IPlatformBridge; // Casino platform integration
  assetManifest?: IAssetManifest;  // Optional asset manifest
  symbolMap: SymbolMap;            // Symbol ID -> texture key mapping
  paytableData: Record<number, Record<string, number>>; // Payout table
}
```

#### Public Methods

| Method | Description |
|--------|-------------|
| `getState()` | Get the current `GameState` |
| `getEvents()` | Get the `GameEvents` event bus |
| `getRenderer()` | Get the `Renderer` instance |
| `destroy()` | Clean up all resources and stop the game |

### GameConfig

Configuration class for game settings.

```typescript
const config = new GameConfig({
  apiBaseUrl: string;      // REST API base URL
  wsBaseUrl: string;       // WebSocket base URL
  gameId: string;          // Unique game identifier
  mode: 'fun' | 'real';    // Play mode
  locale: string;          // Language code (e.g., 'en', 'de')
  reelCount: number;       // Number of reels (default: 5)
  rowCount: number;        // Number of rows (default: 3)
  currencySymbol: string;  // Currency symbol (default: '$')
  features?: {             // Feature flags
    autoplay: boolean;
    fastSpin: boolean;
    realityCheck: boolean;
    fullscreen: boolean;
  };
});
```

### GameState

Holds the current game state (read/write properties):

```typescript
interface IGameState {
  balance: number;         // Current player balance
  currentBet: number;      // Current bet amount
  isSpinning: boolean;     // Whether reels are spinning
  isBonusActive: boolean;  // Whether bonus game is active
  freeSpinsRemaining: number;
  lastWin: number;
  totalWin: number;
}
```

### Asset Manifest

Complete asset manifest example:

```typescript
const assetManifest: IAssetManifest = {
  // Individual textures
  textures: [
    'assets/background.jpg',
    'assets/logo.png',
  ],
  
  // Texture atlases (recommended)
  atlases: [
    {
      name: 'symbols',
      jsonUrl: 'assets/atlas/symbols.json',
      imageUrl: 'assets/atlas/symbols.png',
      format: 'texturepacker', // or 'freetype', 'custom', 'auto'
    },
  ],
  
  // Sound effects
  sounds: [
    { name: 'spin', url: 'sounds/spin.mp3' },
    { name: 'win', url: 'sounds/win.mp3' },
  ],
  
  // Custom fonts
  fonts: [
    { family: 'SlotFont', url: 'fonts/slot.ttf' },
  ],
  
  // Lottie animations
  lottie: [
    { key: 'big_win', url: 'animations/big_win.json' },
  ],
  
  // Spine animations
  spine: [
    {
      key: 'character',
      skeletonUrl: 'spine/character.json',
      atlasUrl: 'spine/character.atlas',
      textureUrls: ['spine/character.png'],
    },
  ],
};
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

---

**Need help?** Open an issue on GitHub or join our Discord community.