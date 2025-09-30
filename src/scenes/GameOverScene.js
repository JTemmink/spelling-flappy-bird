import DatabaseManager from '../managers/DatabaseManager.js';
import AuthManager from '../managers/AuthManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import WordManager from '../managers/WordManager.js';
import { GAME_OVER_STYLE } from '../utils/constants.js';

/**
 * GameOverScene - Displays session results and saves to database
 * Shows final stats, checks for highscores, and provides navigation options
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.sessionStats = data.sessionStats;
    if (!this.sessionStats) {
      console.error('No session stats provided to GameOverScene');
    }
  }

  preload() {
    // Load background for game over screen
    this.load.image('background', 'flappybirdassets/sprites/background-day.png');
    this.load.image('base', 'flappybirdassets/sprites/base.png');
  }

  async create() {
    // Create background (scale to fit 800x600 canvas)
    const bg = this.add.image(400, 300, 'background');
    bg.setDisplaySize(800, 600);
    bg.setDepth(-2);

    // Add base/ground at bottom
    const base = this.add.image(400, 568, 'base');
    base.setDisplaySize(800, 112);
    base.setDepth(-1);

    // Add semi-transparent dark overlay (existing code continues here)
    this.add.rectangle(400, 300, 800, 600, GAME_OVER_STYLE.overlayColor, GAME_OVER_STYLE.overlayAlpha).setDepth(0);

    // Title
    this.add.text(400, 80, 'Game Over', {
      fontSize: GAME_OVER_STYLE.titleFontSize,
      color: '#FFFFFF',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Display stats
    const scoreColor = this.sessionStats.score >= 0 ? '#4CAF50' : '#F44336';
    this.add.text(400, 160, `Final Score: ${this.sessionStats.score}`, {
      fontSize: GAME_OVER_STYLE.scoreFontSize,
      color: scoreColor,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(400, 220, `Words Attempted: ${this.sessionStats.wordsAttempted}`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(400, 260, `Correct: ${this.sessionStats.wordsCorrect}`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#4CAF50',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(400, 300, `Wrong: ${this.sessionStats.wordsWrong}`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#F44336',
      align: 'center'
    }).setOrigin(0.5);

    const accuracyPercent = (this.sessionStats.accuracy * 100).toFixed(1);
    this.add.text(400, 340, `Accuracy: ${accuracyPercent}%`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    const duration = this.formatDuration(this.sessionStats.duration);
    this.add.text(400, 380, `Duration: ${duration}`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(400, 420, `Difficulty: ${this.sessionStats.difficulty || 'easy'}`, {
      fontSize: GAME_OVER_STYLE.statFontSize,
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    // Get current player
    this.currentPlayer = await AuthManager.getInstance().getCurrentUser();
    this.isHighscore = false;

    // Save session to database (if authenticated)
    if (this.currentPlayer && this.sessionStats) {
      try {
        // Save game session
        const sessionData = {
          player_id: this.currentPlayer.id,
          score: this.sessionStats.score,
          words_attempted: this.sessionStats.wordsAttempted,
          words_correct: this.sessionStats.wordsCorrect,
          words_wrong: this.sessionStats.wordsWrong,
          accuracy: this.sessionStats.accuracy,
          difficulty: this.sessionStats.difficulty || 'easy',
          duration_seconds: this.sessionStats.duration
        };
        await DatabaseManager.getInstance().saveGameSession(sessionData);
        console.log('Game session saved to database');
        
        // Check if this is a highscore (only save if score > 0)
        if (this.sessionStats.score > 0) {
          const { data: highscores } = await DatabaseManager.getInstance().getHighscores(1, sessionData.difficulty);
          const topScore = highscores?.[0]?.score || 0;
          
          if (this.sessionStats.score > topScore || highscores.length === 0) {
            // New highscore!
            await DatabaseManager.getInstance().saveHighscore(
              this.currentPlayer.id,
              this.sessionStats.score,
              sessionData.difficulty
            );
            this.isHighscore = true;
            console.log('New highscore saved!');
          }
        }
      } catch (error) {
        console.error('Error saving session data:', error);
      }
    }

    // Display highscore message (if applicable)
    if (this.isHighscore) {
      this.add.text(400, 470, '🎉 NEW HIGHSCORE! 🎉', {
        fontSize: '28px',
        color: GAME_OVER_STYLE.highscoreColor,
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);
    }

    // Create buttons
    this.createButtons();
  }

  createButtons() {
    // Play Again button
    const playAgainButton = this.add.rectangle(400, 520, GAME_OVER_STYLE.buttonWidth, GAME_OVER_STYLE.buttonHeight, GAME_OVER_STYLE.buttonColor);
    playAgainButton.setStrokeStyle(2, 0xFFFFFF);
    playAgainButton.setInteractive();
    
    this.add.text(400, 520, 'Play Again', {
      fontSize: '24px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    playAgainButton.on('pointerdown', () => this.onPlayAgain());
    playAgainButton.on('pointerover', () => {
      playAgainButton.setScale(1.05);
      playAgainButton.setFillStyle(0x66BB6A);
    });
    playAgainButton.on('pointerout', () => {
      playAgainButton.setScale(1);
      playAgainButton.setFillStyle(GAME_OVER_STYLE.buttonColor);
    });

    // Main Menu button
    const mainMenuButton = this.add.rectangle(400, 580, GAME_OVER_STYLE.buttonWidth, GAME_OVER_STYLE.buttonHeight, GAME_OVER_STYLE.buttonColorAlt);
    mainMenuButton.setStrokeStyle(2, 0xFFFFFF);
    mainMenuButton.setInteractive();
    
    this.add.text(400, 580, 'Main Menu', {
      fontSize: '24px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);

    mainMenuButton.on('pointerdown', () => this.onMainMenu());
    mainMenuButton.on('pointerover', () => {
      mainMenuButton.setScale(1.05);
      mainMenuButton.setFillStyle(0x42A5F5);
    });
    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setScale(1);
      mainMenuButton.setFillStyle(GAME_OVER_STYLE.buttonColorAlt);
    });
  }

  onPlayAgain() {
    // Reset ScoreManager
    ScoreManager.getInstance().reset();
    
    // Clear WordManager session
    WordManager.getInstance().clearSession();
    
    // Stop GameOverScene and start GameScene
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene');
  }

  onMainMenu() {
    console.log('Main Menu not implemented yet (Phase 5)');
    // For now, just restart game
    this.onPlayAgain();
  }

  /**
   * Format duration in seconds to MM:SS format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
