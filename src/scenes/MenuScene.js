import AuthManager from '../managers/AuthManager.js';
import DatabaseManager from '../managers/DatabaseManager.js';
import { DIFFICULTY, MENU_STYLE } from '../utils/constants.js';

/**
 * MenuScene - Main entry point for the game
 * Provides difficulty selection, leaderboard, and authentication
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init() {
    this.currentUser = null;
    this.selectedDifficulty = 'easy';
    this.leaderboardData = [];
  }

  preload() {
    // Load background for menu (same as game)
    this.load.image('background', 'flappybirdassets/sprites/background-day.png');
    this.load.image('base', 'flappybirdassets/sprites/base.png');
  }

  async create() {
    // Create background (scale to fit 800x600 canvas)
    const bg = this.add.image(400, 300, 'background');
    bg.setDisplaySize(800, 600);
    bg.setDepth(-2);

    // Add base/ground at bottom for visual consistency
    const base = this.add.image(400, 568, 'base');
    base.setDisplaySize(800, 112);
    base.setDepth(-1);

    // Title
    this.add.text(400, 80, 'Spelling Flappy Bird', {
      fontSize: MENU_STYLE.titleFontSize,
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(400, 130, 'Leer Spellen!', {
      fontSize: MENU_STYLE.subtitleFontSize,
      color: '#FFD700'
    }).setOrigin(0.5);

    // Check Authentication
    this.currentUser = await AuthManager.getInstance().getCurrentUser();
    
    if (this.currentUser) {
      this.add.text(400, 180, `Welkom, ${this.currentUser.user_metadata?.username || this.currentUser.email}!`, {
        fontSize: '20px',
        color: '#FFFFFF'
      }).setOrigin(0.5);
    } else {
      this.add.text(400, 180, 'Gast Modus', {
        fontSize: '20px',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      
      // Login button
      const loginButton = this.add.rectangle(400, 210, 120, 40, 0xFFFFFF)
        .setInteractive()
        .on('pointerdown', () => {
          console.log('Login not fully implemented - use Supabase Auth UI');
        });
      
      this.add.text(400, 210, 'Login', {
        fontSize: '16px',
        color: '#000000'
      }).setOrigin(0.5);
    }

    // Difficulty Selection
    this.add.text(400, 250, 'Kies Moeilijkheid:', {
      fontSize: MENU_STYLE.subtitleFontSize,
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Difficulty buttons
    this.createDifficultyButtons();

    // Start Game Button
    const startButton = this.add.rectangle(400, 400, 250, 60, MENU_STYLE.startButtonColor)
      .setInteractive()
      .on('pointerdown', () => this.startGame())
      .on('pointerover', () => startButton.setScale(1.05))
      .on('pointerout', () => startButton.setScale(1));

    this.add.text(400, 400, 'Start Spel', {
      fontSize: '28px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Leaderboard Section
    this.add.text(400, 480, 'Top 10 Scores', {
      fontSize: '20px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Load and display leaderboard
    await this.refreshLeaderboard();

    // Login/Register buttons (if not authenticated)
    if (!this.currentUser) {
      const loginBtn = this.add.rectangle(300, 560, 120, 40, 0xFFFFFF)
        .setInteractive()
        .on('pointerdown', () => {
          console.log('Login not fully implemented - use Supabase Auth UI');
        });
      
      this.add.text(300, 560, 'Login', {
        fontSize: '16px',
        color: '#000000'
      }).setOrigin(0.5);

      const registerBtn = this.add.rectangle(500, 560, 120, 40, 0xFFFFFF)
        .setInteractive()
        .on('pointerdown', () => {
          console.log('Register not fully implemented - use Supabase Auth UI');
        });
      
      this.add.text(500, 560, 'Registreer', {
        fontSize: '16px',
        color: '#000000'
      }).setOrigin(0.5);
    }

    // Admin Button (if user is admin)
    if (this.currentUser && AuthManager.getInstance().isAdmin()) {
      const adminButton = this.add.rectangle(700, 560, 100, 30, 0xFFD700)
        .setInteractive()
        .on('pointerdown', () => {
          window.open('admin.html', '_blank');
        });
      
      this.add.text(700, 560, 'Admin Panel', {
        fontSize: '14px',
        color: '#000000'
      }).setOrigin(0.5);
    }
  }

  createDifficultyButtons() {
    const difficulties = [
      { key: 'easy', label: 'Makkelijk', x: 200, color: MENU_STYLE.difficultyColors.easy },
      { key: 'medium', label: 'Gemiddeld', x: 400, color: MENU_STYLE.difficultyColors.medium },
      { key: 'hard', label: 'Moeilijk', x: 600, color: MENU_STYLE.difficultyColors.hard }
    ];

    this.difficultyButtons = [];

    difficulties.forEach((diff, index) => {
      const button = this.add.rectangle(diff.x, 300, MENU_STYLE.buttonWidth, MENU_STYLE.buttonHeight, diff.color)
        .setInteractive()
        .on('pointerdown', () => this.onDifficultySelect(diff.key))
        .on('pointerover', () => button.setScale(1.05))
        .on('pointerout', () => button.setScale(1));

      const text = this.add.text(diff.x, 300, diff.label, {
        fontSize: MENU_STYLE.buttonFontSize,
        color: '#FFFFFF',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.difficultyButtons.push({ button, text, key: diff.key });

      // Highlight default selection (easy)
      if (diff.key === 'easy') {
        button.setScale(1.1);
        this.highlight(button, MENU_STYLE.difficultyColors[diff.key]);
      }
    });
  }

  highlight(rect, color) {
    rect.setFillStyle(color, 1);
  }

  startGame() {
    // Store selected difficulty in registry
    this.registry.set('difficulty', this.selectedDifficulty);
    
    // Stop MenuScene and start GameScene
    this.scene.stop('MenuScene');
    this.scene.start('GameScene');
    
    console.log('Starting game with difficulty:', this.selectedDifficulty);
  }

  onDifficultySelect(difficulty) {
    this.selectedDifficulty = difficulty;
    
    // Update button highlights
    this.difficultyButtons.forEach(({ button, key }) => {
      if (key === difficulty) {
        button.setScale(1.1);
        this.highlight(button, MENU_STYLE.difficultyColors[key]);
      } else {
        button.setScale(1);
        this.highlight(button, MENU_STYLE.difficultyColors[key]);
      }
    });

    // Refresh leaderboard for new difficulty
    this.refreshLeaderboard();
  }

  async refreshLeaderboard() {
    try {
      const { data, error } = await DatabaseManager.getInstance().getHighscores(10, this.selectedDifficulty);
      
      // Clear existing leaderboard display
      if (this.leaderboardDisplay) {
        this.leaderboardDisplay.forEach(text => text.destroy());
      }
      
      this.leaderboardDisplay = [];

      if (error) {
        console.error('Error loading leaderboard:', error);
        this.leaderboardDisplay = [
          this.add.text(400, 510, 'Fout bij laden scores', {
            fontSize: MENU_STYLE.leaderboardFontSize,
            color: '#FF0000'
          }).setOrigin(0.5)
        ];
        return;
      }

      this.leaderboardData = data || [];

      if (this.leaderboardData.length === 0) {
        this.leaderboardDisplay.push(
          this.add.text(400, 510, 'Nog geen scores!', {
            fontSize: MENU_STYLE.leaderboardFontSize,
            color: '#FFFFFF'
          }).setOrigin(0.5)
        );
      } else {
        // Display top 5 scores
        this.leaderboardData.slice(0, 5).forEach((score, index) => {
          const username = score.players?.username || 'Gast';
          const scoreText = `${index + 1}. ${username}: ${score.score}`;
          
          this.leaderboardDisplay.push(
            this.add.text(400, 510 + (index * 12), scoreText, {
              fontSize: MENU_STYLE.leaderboardFontSize,
              color: '#FFFFFF'
            }).setOrigin(0.5)
          );
        });
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      
      if (this.leaderboardDisplay) {
        this.leaderboardDisplay.forEach(text => text.destroy());
      }
      
      this.leaderboardDisplay = [
        this.add.text(400, 510, 'Fout bij laden scores', {
          fontSize: MENU_STYLE.leaderboardFontSize,
          color: '#FF0000'
        }).setOrigin(0.5)
      ];
    }
  }
}
