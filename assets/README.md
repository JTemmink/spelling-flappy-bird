# Assets Directory

This directory contains game assets (sprites, sounds, fonts) for Spelling Flappy Bird.

## Current Status

The game currently uses **placeholder graphics** (generated textures and rectangles). Real assets are **optional** - the game is fully playable without them.

## Adding Real Assets

### 1. Sprites (Recommended: Kenney.nl Flappy Bird Pack)

**Download:**
- Visit: https://kenney.nl/assets/flappy-bird-pack
- License: CC0 (public domain, no attribution required)
- Extract files to `/assets/sprites/`

**Required files:**
- `bird.png` - Bird sprite (40x40px recommended)
- `pipe-top.png` - Top pipe sprite
- `pipe-bottom.png` - Bottom pipe sprite
- `background.png` - Background image (800x600px or tileable)

**After adding sprites:**
1. Uncomment asset loading in `src/scenes/GameScene.js` preload() method
2. Update `src/entities/Bird.js` to use loaded sprite instead of generated texture (line 24)
3. Update `src/entities/Pipe.js` to use loaded sprites instead of rectangles

### 2. Sound Effects (Optional)

**Download from:**
- **freesound.org** - Search with CC0 license filter
- **jsfxr.com** - Generate retro 8-bit sounds
- **zapsplat.com** - Free game sound effects

**Required files:**
- `jump.mp3` - Bird jump sound (~0.2s, light/bouncy)
- `correct.mp3` - Correct answer sound (~0.5s, positive/cheerful)
- `wrong.mp3` - Wrong answer sound (~0.5s, negative/buzzer)
- `crash.mp3` - Crash sound (~0.3s, impact)

**After adding sounds:**
1. Uncomment audio loading in `src/scenes/GameScene.js` preload() method
2. Uncomment `this.sound.play()` calls in GameScene methods (lines 225, 293, 319, 329)

### 3. Custom Fonts (Optional)

**Recommended fonts for children (8-11 years):**
- **Comic Neue** - Modern, readable
- **Fredoka One** - Rounded, friendly
- **Baloo** - Playful, child-friendly

All available from Google Fonts (free, open source).

**After adding font:**
1. Load in GameScene.preload(): `this.load.font('game-font', 'assets/fonts/game-font.ttf')`
2. Update `src/utils/constants.js` TEXT_STYLE.fontFamily to 'game-font'

## File Structure

```
assets/
├── sprites/
│   ├── bird.png
│   ├── pipe-top.png
│   ├── pipe-bottom.png
│   └── background.png
├── sounds/
│   ├── jump.mp3
│   ├── correct.mp3
│   ├── wrong.mp3
│   └── crash.mp3
└── fonts/
    └── game-font.ttf
```

## Asset Guidelines

**Sprites:**
- Format: PNG with transparency
- Size: Keep under 2048x2048 for mobile compatibility
- Style: Consistent visual style across all assets

**Sounds:**
- Format: MP3 or OGG (MP3 recommended for broad compatibility)
- Length: Keep under 1 second for responsiveness
- Volume: Normalize to -3dB to prevent clipping

**Fonts:**
- Format: TTF or WOFF
- Size: Readable at 16px minimum
- Style: Child-friendly, clear letterforms

## License Information

- **Kenney.nl assets**: CC0 (public domain)
- **freesound.org**: Check individual sound licenses (filter by CC0 for simplest)
- **Google Fonts**: Open Font License (free for commercial use)

Always verify licenses before using assets in production.

## Performance Notes

- Use texture atlases for multiple sprites (Phaser supports this)
- Compress images with tools like TinyPNG
- Use audio sprites for multiple sounds in one file (advanced)
- Test on mobile devices - large assets can cause loading delays

## Need Help?

If you need help finding or integrating assets, check:
- Phaser 3 documentation: https://photonstorm.github.io/phaser3-docs/
- Kenney.nl asset packs: https://kenney.nl/assets
- Phaser Discord community: https://discord.gg/phaser
