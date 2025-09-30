/**
 * Game Constants
 * Central configuration file for all game parameters and settings
 */

/**
 * Difficulty levels with different gameplay parameters
 */
export const DIFFICULTY = {
  EASY: {
    pipeSpeed: 150,
    gapSize: 200,
    jumpVelocity: -400,
    penalty: -5,
    points: 10,
    wordLength: { min: 3, max: 5 }
  },
  MEDIUM: {
    pipeSpeed: 250,
    gapSize: 150,
    jumpVelocity: -450,
    penalty: -10,
    points: 15,
    wordLength: { min: 5, max: 8 }
  },
  HARD: {
    pipeSpeed: 350,
    gapSize: 120,
    jumpVelocity: -500,
    penalty: -15,
    points: 20,
    wordLength: { min: 8, max: 15 }
  }
};

/**
 * Core game configuration values
 */
export const GAME_CONFIG = {
  birdStartX: 150,           // Bird's horizontal position (stays constant)
  birdStartY: 300,           // Bird's vertical starting position (middle of 600px height)
  pipeSpawnX: 900,           // Spawn pipes off-screen to the right
  pipeSpawnInterval: 2000,   // Milliseconds between pipe spawns
  pipeWidth: 80,             // Width of pipe rectangles
  respawnDelay: 1500,        // Milliseconds before bird respawns after crash
  pipePoolSize: 4,           // Number of pipes to create for object pooling
  scoreTextX: 20,            // X position for score display (top-left)
  scoreTextY: 20,            // Y position for score display
  gateDetectionOffset: 40    // Pixels past pipe center to trigger gate detection
};

/**
 * Physics configuration
 */
export const PHYSICS = {
  gravity: 800,              // Matches the gravity set in main.js
  maxVelocityY: 600,         // Terminal velocity to prevent bird falling too fast
  rotationSpeed: 2.5         // How fast bird rotates based on velocity
};

/**
 * Game state constants
 */
export const GAME_STATES = {
  PLAYING: 'playing',
  CRASHED: 'crashed',
  RESPAWNING: 'respawning'
};

/**
 * Color palette for placeholder graphics
 */
export const COLORS = {
  BIRD: 0xFFD700,           // Gold color
  PIPE_TOP: 0x228B22,       // Forest green
  PIPE_BOTTOM: 0x228B22,    // Forest green
  PIPE_OUTLINE: 0x006400    // Dark green
};

/**
 * Text styling configuration
 */
export const TEXT_STYLE = {
  fontSize: '32px',
  fontFamily: 'Arial, sans-serif',  // Phase 5 will use custom font
  fontStyle: 'bold',
  color: '#FFFFFF',
  stroke: '#000000',
  strokeThickness: 4,
  align: 'center',
  wordWrap: { width: 150 }  // Wrap long words
};

/**
 * Visual feedback colors - Color-blind friendly (deuteranopia/protanopia)
 * Using blue/orange instead of green/red for better accessibility
 */
export const FEEDBACK_COLORS = {
  CORRECT: 0x2196F3,          // Bright blue for correct choice (was green)
  WRONG: 0xFF9800,            // Bright orange for wrong choice (was red)
  SCORE_POSITIVE: '#2196F3',  // Blue for positive score display
  SCORE_NEGATIVE: '#FF9800',  // Orange for negative score display
  CORRECT_PATTERN: 0x4CAF50,  // Optional: green accent for non-colorblind users
  WRONG_PATTERN: 0xF44336     // Optional: red accent for non-colorblind users
};

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  correctGlowDuration: 400,     // Milliseconds for green glow effect
  wrongShakeDuration: 300,      // Milliseconds for red shake effect
  shakeIntensity: 10,           // Pixels to shake left/right
  glowScale: 1.15               // Scale multiplier for glow pulse
};

/**
 * Adaptive learning algorithm parameters
 */
export const ADAPTIVE_LEARNING = {
  PRIORITY_WEIGHT: 1000,        // Weight for words wrong in last 3 days
  MASTERED_WEIGHT: 1,           // Weight for mastered words (3+ correct streak)
  BASE_WEIGHT: 10,              // Base weight for learning words
  WRONG_MULTIPLIER: 5,          // Multiplier for wrong count (weight = base + wrong * multiplier)
  REVIEW_DAYS: 3,               // Days to keep wrong words in high-priority review
  MASTERY_STREAK: 3,            // Consecutive correct answers needed for mastery
  SESSION_PRIORITY_COUNT: 3     // Number of priority words at session start
};

/**
 * GameOverScene styling configuration
 */
export const GAME_OVER_STYLE = {
  overlayColor: 0x000000,
  overlayAlpha: 0.7,
  titleFontSize: '48px',
  scoreFontSize: '36px',
  statFontSize: '24px',
  buttonWidth: 200,
  buttonHeight: 50,
  buttonColor: 0x4CAF50,        // Green for Play Again
  buttonColorAlt: 0x2196F3,     // Blue for Main Menu
  highscoreColor: '#FFD700',    // Gold
  statSpacing: 40               // Vertical spacing between stats
};

/**
 * Asset file paths
 * Assets from flappybirdassets folder (original Flappy Bird assets)
 */
export const ASSET_PATHS = {
  sprites: {
    birdUpflap: 'flappybirdassets/sprites/bluebird-upflap.png',
    birdMidflap: 'flappybirdassets/sprites/bluebird-midflap.png',
    birdDownflap: 'flappybirdassets/sprites/bluebird-downflap.png',
    pipe: 'flappybirdassets/sprites/pipe-green.png',
    background: 'flappybirdassets/sprites/background-day.png',
    base: 'flappybirdassets/sprites/base.png',
    // Alternative bird colors available:
    // redbird-upflap/midflap/downflap.png
    // yellowbird-upflap/midflap/downflap.png
    // Alternative background:
    // background-night.png
  },
  sounds: {
    jump: 'flappybirdassets/audio/wing.ogg',
    correct: 'flappybirdassets/audio/point.ogg',
    wrong: 'flappybirdassets/audio/hit.ogg',
    crash: 'flappybirdassets/audio/die.ogg',
    swoosh: 'flappybirdassets/audio/swoosh.ogg'
  }
};

/**
 * MenuScene styling configuration
 */
export const MENU_STYLE = {
  titleFontSize: '48px',
  subtitleFontSize: '24px',
  buttonFontSize: '20px',
  buttonWidth: 150,
  buttonHeight: 50,
  difficultyColors: {
    easy: 0x4CAF50,      // Green
    medium: 0xFF9800,    // Orange
    hard: 0xF44336       // Red
  },
  startButtonColor: 0x2196F3,  // Blue
  leaderboardFontSize: '16px'
};