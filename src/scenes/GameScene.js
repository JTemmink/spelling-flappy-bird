import Bird from '../entities/Bird.js';
import Pipe from '../entities/Pipe.js';
import WordManager from '../managers/WordManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import DatabaseManager from '../managers/DatabaseManager.js';
import AuthManager from '../managers/AuthManager.js';
import { GAME_CONFIG, GAME_STATES, DIFFICULTY, TEXT_STYLE, FEEDBACK_COLORS, ANIMATION_CONFIG, COLORS } from '../utils/constants.js';

/**
 * Main GameScene class extending Phaser.Scene
 * Handles the core Flappy Bird gameplay loop with state management
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load bird animation frames (3 frames for flapping animation)
    this.load.image('bird-upflap', 'flappybirdassets/sprites/bluebird-upflap.png');
    this.load.image('bird-midflap', 'flappybirdassets/sprites/bluebird-midflap.png');
    this.load.image('bird-downflap', 'flappybirdassets/sprites/bluebird-downflap.png');
    
    // Load pipe sprite
    this.load.image('pipe-green', 'flappybirdassets/sprites/pipe-green.png');
    
    // Load background and base/ground
    this.load.image('background', 'flappybirdassets/sprites/background-day.png');
    this.load.image('base', 'flappybirdassets/sprites/base.png');
    
    // Load sound effects (.ogg format for broad browser support)
    this.load.audio('jump', 'flappybirdassets/audio/wing.ogg');
    this.load.audio('correct', 'flappybirdassets/audio/point.ogg');
    this.load.audio('wrong', 'flappybirdassets/audio/hit.ogg');
    this.load.audio('crash', 'flappybirdassets/audio/die.ogg');
  }

  async create() {
    // Initialize game state
    this.gameState = GAME_STATES.PLAYING;
    
    // Get difficulty from registry (set by MenuScene)
    const difficultyKey = this.registry.get('difficulty') || 'easy';
    this.currentDifficulty = DIFFICULTY[difficultyKey.toUpperCase()];
    this.pipeSpawnTimer = 0;
    this.respawnTimer = 0;

    // Initialize managers
    await WordManager.init();
    await ScoreManager.init();
    this.wordManager = WordManager.getInstance();
    this.scoreManager = ScoreManager.getInstance();
    this.scoreManager.setDifficulty(difficultyKey);
    this.currentPlayer = null;
    this.scoreText = null;

    // Create background (scale to fit 800x600 canvas)
    const bg = this.add.image(400, 300, 'background');
    bg.setDisplaySize(800, 600);
    bg.setDepth(-2);

    // Create scrolling base/ground at bottom (112px height, positioned at y=568)
    this.base = this.add.tileSprite(400, 568, 800, 112, 'base');
    this.base.setDepth(5); // Above pipes but below bird

    // Create score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', { 
      fontSize: '28px', 
      fontFamily: 'Arial', 
      fontStyle: 'bold', 
      color: '#FFFFFF', 
      stroke: '#000000', 
      strokeThickness: 3 
    });
    this.scoreText.setDepth(100); // Render on top of everything

    // Create bird
    this.bird = new Bird(this, GAME_CONFIG.birdStartX, GAME_CONFIG.birdStartY);
    this.bird.setDepth(10); // Render on top of pipes

    // Create pipe group
    this.pipes = this.physics.add.group({ 
      classType: Pipe, 
      runChildUpdate: false 
    });

    // Create initial pipe pool
    for (let i = 0; i < GAME_CONFIG.pipePoolSize; i++) {
      const randomGapY = this.getRandomGapY();
      const pipe = new Pipe(
        this, 
        GAME_CONFIG.pipeSpawnX + i * 300, 
        randomGapY, 
        this.currentDifficulty.gapSize
      );
      this.pipes.add(pipe);
    }

    // Setup collision detection
    this.physics.add.overlap(this.bird, this.pipes, this.onCollision, null, this);

    // Setup input handlers
    this.input.keyboard.on('keydown-SPACE', this.onJump, this);
    this.input.on('pointerdown', this.onJump, this);

    // Initialize timers
    this.pipeSpawnTimer = 0;
    this.respawnTimer = 0;

    // Async initialization
    try {
      // Load words from database
      await this.wordManager.loadWords();
      
      // Get current user for stats saving
      this.currentPlayer = await AuthManager.getInstance().getCurrentUser();
      if (!this.currentPlayer) {
        console.warn('No authenticated user, using random word selection');
      } else {
        // Initialize adaptive session for authenticated users
        await this.wordManager.initializeSession(this.currentPlayer.id, difficultyKey);
        console.log('Adaptive session initialized for player:', this.currentPlayer.username);
      }
      
      // Start score manager session
      this.scoreManager.startSession();
      
      // Assign words to initial pipes
      this.pipes.getChildren().forEach(pipe => {
        const word = this.currentPlayer 
          ? this.wordManager.getWeightedWord() 
          : this.wordManager.getRandomWord();
        if (word) {
          pipe.setWord(word);
        }
      });
    } catch (error) {
      console.error('Error during game initialization:', error);
      // Show error message to player
      this.add.text(400, 300, 'Error loading words. Please refresh the page.', {
        fontSize: '24px',
        color: '#FF0000',
        align: 'center'
      }).setOrigin(0.5);
    }
  }

  update(time, delta) {
    switch (this.gameState) {
      case GAME_STATES.PLAYING:
        this.updatePlaying(delta);
        break;
      case GAME_STATES.CRASHED:
        this.updateCrashed(delta);
        break;
      case GAME_STATES.RESPAWNING:
        this.updateRespawning();
        break;
    }

    // Check for game over trigger (ESC key)
    if (this.input.keyboard.addKey('ESC').isDown) {
      this.triggerGameOver();
    }
  }

  /**
   * Update game logic when playing
   */
  updatePlaying(delta) {
    // Update bird
    this.bird.update();

    // Scroll the base/ground to create movement illusion
    this.base.tilePositionX += this.currentDifficulty.pipeSpeed / 60;

    // Update all pipes
    this.pipes.getChildren().forEach(pipe => {
      pipe.update(this.currentDifficulty.pipeSpeed / 60);
    });

    // Check for gate passages (bird passed through gap)
    this.pipes.getChildren().forEach(pipe => {
      // Check if bird has passed pipe center and hasn't been scored yet
      if (!pipe.scored && this.bird.x > pipe.x + GAME_CONFIG.pipeWidth/2 + GAME_CONFIG.gateDetectionOffset) {
        // Determine which gate bird went through
        const chosenGate = pipe.getChosenGate(this.bird.y);
        const isCorrect = pipe.isCorrectChoice(chosenGate);
        
        // Mark as scored to prevent double-scoring
        pipe.markScored();
        
        // Process choice
        this.processGateChoice(pipe, chosenGate, isCorrect);
      }
    });

    // Check for off-screen pipes and recycle
    this.pipes.getChildren().forEach(pipe => {
      if (pipe.isOffScreen()) {
        const randomGapY = this.getRandomGapY();
        pipe.reset(GAME_CONFIG.pipeSpawnX, randomGapY, this.currentDifficulty.gapSize);
        // Assign new word to recycled pipe
        const word = this.currentPlayer 
          ? this.wordManager.getWeightedWord() 
          : this.wordManager.getRandomWord();
        if (word) {
          pipe.setWord(word);
        }
      }
    });

    // Check if bird fell off screen
    if (this.bird.y > 650) {
      this.onCollision();
    }
  }

  /**
   * Update game logic when crashed
   */
  updateCrashed(delta) {
    this.respawnTimer += delta;
    
    if (this.respawnTimer >= GAME_CONFIG.respawnDelay) {
      this.gameState = GAME_STATES.RESPAWNING;
      this.bird.respawn();
      this.respawnTimer = 0;
      
      // Wait for bird fade-in to complete, then resume playing
      this.time.delayedCall(500, () => {
        this.gameState = GAME_STATES.PLAYING;
      });
    }
  }

  /**
   * Update game logic when respawning
   */
  updateRespawning() {
    // Pipes continue moving during respawn
    this.pipes.getChildren().forEach(pipe => {
      pipe.update(this.currentDifficulty.pipeSpeed / 60);
    });
  }

  /**
   * Handle jump input
   */
  onJump() {
    if (this.gameState === GAME_STATES.PLAYING) {
      this.bird.jump(this.currentDifficulty.jumpVelocity);
      this.sound.play('jump');
    }
  }

  /**
   * Process gate choice and update score
   * @param {Pipe} pipe - The pipe that was passed through
   * @param {string} chosenGate - 'top' or 'bottom'
   * @param {boolean} isCorrect - Whether the choice was correct
   */
  async processGateChoice(pipe, chosenGate, isCorrect) {
    // Update score
    const result = isCorrect ? this.scoreManager.addCorrect() : this.scoreManager.addWrong();
    
    // Update score text
    this.scoreText.setText('Score: ' + result.score);
    this.scoreText.setColor(result.score >= 0 ? FEEDBACK_COLORS.SCORE_POSITIVE : FEEDBACK_COLORS.SCORE_NEGATIVE);
    
    // Show visual feedback
    if (isCorrect) {
      this.showCorrectFeedback(pipe);
    } else {
      this.showWrongFeedback(pipe);
    }
    
    // Save enhanced stats to database (async, don't await)
    if (this.currentPlayer && pipe.wordData) {
      try {
        const wordId = pipe.wordData.id;
        // Use new signature: upsertWordStat(playerId, wordId, isCorrect)
        await DatabaseManager.getInstance().upsertWordStat(
          this.currentPlayer.id, 
          wordId, 
          isCorrect
        );
        console.log(`Word stat updated: ${pipe.wordData.correct_spelling} - ${isCorrect ? 'correct' : 'wrong'}`);
      } catch (error) {
        console.error('Error saving word stats:', error);
      }
    }
    
    // Handle wrong choice - trigger crash
    if (!isCorrect) {
      this.onCollision();
    }
  }

  /**
   * Show correct choice feedback
   * @param {Pipe} pipe - The pipe to highlight
   */
  showCorrectFeedback(pipe) {
    // Add green tint to pipe children
    pipe.topPipe.setTint(FEEDBACK_COLORS.CORRECT);
    pipe.bottomPipe.setTint(FEEDBACK_COLORS.CORRECT);
    
    // Create scale pulse tween
    this.tweens.add({
      targets: pipe,
      scaleX: ANIMATION_CONFIG.glowScale,
      scaleY: ANIMATION_CONFIG.glowScale,
      duration: ANIMATION_CONFIG.correctGlowDuration / 2,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        pipe.topPipe.clearTint();
        pipe.bottomPipe.clearTint();
      }
    });
    this.sound.play('correct');
  }

  /**
   * Show wrong choice feedback
   * @param {Pipe} pipe - The pipe to shake
   */
  showWrongFeedback(pipe) {
    // Add red tint to pipe children
    pipe.topPipe.setTint(FEEDBACK_COLORS.WRONG);
    pipe.bottomPipe.setTint(FEEDBACK_COLORS.WRONG);
    
    // Create shake tween
    const originalX = pipe.x;
    this.tweens.add({
      targets: pipe,
      x: originalX - ANIMATION_CONFIG.shakeIntensity,
      duration: ANIMATION_CONFIG.wrongShakeDuration / 4,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        pipe.x = originalX;
        pipe.topPipe.clearTint();
        pipe.bottomPipe.clearTint();
      }
    });
    this.sound.play('wrong');
  }

  /**
   * Handle collision between bird and pipe
   */
  onCollision() {
    if (this.gameState !== GAME_STATES.PLAYING) return;
    
    this.gameState = GAME_STATES.CRASHED;
    this.bird.die();
    this.sound.play('crash');
    console.log('Bird crashed!');
  }

  /**
   * Get random gap Y position within safe bounds
   * @returns {number} Random Y position between 150 and 450
   */
  getRandomGapY() {
    return Phaser.Math.Between(150, 450);
  }

  /**
   * Trigger game over and transition to GameOverScene
   * Called when ESC key is pressed
   */
  triggerGameOver() {
    // Get final stats from ScoreManager
    const stats = this.scoreManager.getStats();
    stats.difficulty = this.registry.get('difficulty') || 'easy'; // Store as string instead of object
    stats.playerId = this.currentPlayer?.id || null;
    
    // Stop the scene and start GameOverScene
    this.scene.stop('GameScene');
    this.scene.start('GameOverScene', { sessionStats: stats });
    
    console.log('Game over triggered, final score:', stats.score);
  }
}
