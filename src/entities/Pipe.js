import { GAME_CONFIG, COLORS, TEXT_STYLE } from '../utils/constants.js';

/**
 * Pipe entity class extending Phaser.GameObjects.Container
 * Handles pipe obstacles with top and bottom rectangles, movement, and recycling
 */
export default class Pipe extends Phaser.GameObjects.Container {
  constructor(scene, x, gapY, gapSize) {
    // Call parent constructor
    super(scene, x, 0);
    
    // Store gap properties
    this.gapY = gapY;
    this.gapSize = gapSize;
    
    // Word data and scoring properties
    this.wordData = null;
    this.scored = false;
    this.topText = null;
    this.bottomText = null;
    
    // Calculate pipe heights
    const topHeight = gapY - gapSize / 2;
    const bottomHeight = scene.scale.height - (gapY + gapSize / 2);
    
    // Create top pipe (flipped upside down)
    this.topPipe = scene.add.image(
      0, // x position relative to container
      gapY - gapSize / 2 - topHeight / 2, // y position
      'pipe-green'
    );
    this.topPipe.setDisplaySize(GAME_CONFIG.pipeWidth, topHeight);
    this.topPipe.setFlipY(true); // Flip upside down for top pipe

    // Create bottom pipe (normal orientation)
    this.bottomPipe = scene.add.image(
      0, // x position relative to container
      gapY + gapSize / 2 + bottomHeight / 2, // y position
      'pipe-green'
    );
    this.bottomPipe.setDisplaySize(GAME_CONFIG.pipeWidth, bottomHeight);
    
    // Create text labels for word display
    this.topText = scene.add.text(0, gapY - gapSize/2 - 60, '', TEXT_STYLE);
    this.topText.setOrigin(0.5);
    
    this.bottomText = scene.add.text(0, gapY + gapSize/2 + 60, '', TEXT_STYLE);
    this.bottomText.setOrigin(0.5);
    
    // Add rectangles and text to container
    this.add([this.topPipe, this.bottomPipe, this.topText, this.bottomText]);
    
    // Add container to scene
    scene.add.existing(this);
    
    // Enable physics on container (static body)
    scene.physics.add.existing(this, true);
    
    // Set physics body size for collision detection
    this.body.setSize(GAME_CONFIG.pipeWidth, scene.scale.height);
  }

  /**
   * Update pipe position (move left)
   * Called every frame from GameScene
   * @param {number} speed - Speed in pixels per frame
   */
  update(speed) {
    this.x -= speed;
    // Update physics body position to match container
    this.body.updateFromGameObject();
  }

  /**
   * Reset pipe position and gap for recycling
   * @param {number} x - New x position
   * @param {number} gapY - New gap center y position
   * @param {number} gapSize - New gap size
   */
  reset(x, gapY, gapSize) {
    // Update position
    this.x = x;
    
    // Update gap properties
    this.gapY = gapY;
    this.gapSize = gapSize;
    
    // Recalculate pipe heights
    const topHeight = gapY - gapSize / 2;
    const bottomHeight = this.scene.scale.height - (gapY + gapSize / 2);
    
    // Update top pipe
    this.topPipe.setDisplaySize(GAME_CONFIG.pipeWidth, topHeight);
    this.topPipe.setPosition(0, gapY - gapSize / 2 - topHeight / 2);
    this.topPipe.setFlipY(true); // Maintain flip for top pipe

    // Update bottom pipe
    this.bottomPipe.setDisplaySize(GAME_CONFIG.pipeWidth, bottomHeight);
    this.bottomPipe.setPosition(0, gapY + gapSize / 2 + bottomHeight / 2);
    
    // Update text positions
    this.topText.setPosition(0, gapY - gapSize/2 - 60);
    this.bottomText.setPosition(0, gapY + gapSize/2 + 60);
    
    // Clear word data and reset scored flag
    this.wordData = null;
    this.topText.setText('');
    this.bottomText.setText('');
    this.scored = false;
    
    // Update physics body position to match container
    this.body.updateFromGameObject();
  }

  /**
   * Set word data and display text labels
   * @param {Object} wordData - Word object with { id, correctSpelling, wrongSpelling, difficulty }
   */
  setWord(wordData) {
    // Randomly determine which gate gets correct spelling
    const correctGate = Phaser.Math.RND.pick(['top', 'bottom']);
    
    // Store word data with correct gate
    this.wordData = { ...wordData, correctGate };
    
    // Set text labels based on correct gate
    if (correctGate === 'top') {
      this.topText.setText(wordData.correctSpelling);
      this.bottomText.setText(wordData.wrongSpelling);
    } else {
      this.topText.setText(wordData.wrongSpelling);
      this.bottomText.setText(wordData.correctSpelling);
    }
    
    // Reset scored flag
    this.scored = false;
  }

  /**
   * Determine which gate the bird passed through based on Y position
   * @param {number} birdY - Bird's Y position when passing through
   * @returns {string} 'top' or 'bottom'
   */
  getChosenGate(birdY) {
    return birdY < this.gapY ? 'top' : 'bottom';
  }

  /**
   * Check if the chosen gate is correct
   * @param {string} chosenGate - 'top' or 'bottom'
   * @returns {boolean} True if correct choice
   */
  isCorrectChoice(chosenGate) {
    return chosenGate === this.wordData.correctGate;
  }

  /**
   * Mark pipe as scored to prevent double-scoring
   */
  markScored() {
    this.scored = true;
  }

  /**
   * Check if pipe has moved completely off screen
   * @returns {boolean} True if pipe should be recycled
   */
  isOffScreen() {
    return this.x < -GAME_CONFIG.pipeWidth;
  }
}
