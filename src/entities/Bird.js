import { GAME_CONFIG, PHYSICS, COLORS } from '../utils/constants.js';

/**
 * Bird entity class extending Phaser.Physics.Arcade.Sprite
 * Handles bird physics, jumping, rotation, and death/respawn animations
 */
export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Call parent constructor with middle flap frame as default
    super(scene, x, y, 'bird-midflap');
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Create bird flap animation if not already created
    if (!scene.anims.exists('bird-flap')) {
      scene.anims.create({
        key: 'bird-flap',
        frames: [
          { key: 'bird-upflap' },
          { key: 'bird-midflap' },
          { key: 'bird-downflap' },
          { key: 'bird-midflap' }
        ],
        frameRate: 10,
        repeat: -1 // Loop forever
      });
    }
    
    // Play the flapping animation
    this.play('bird-flap');
    
    // Configure physics body
    this.body.setCollideWorldBounds(false); // Bird can fall off screen
    this.body.setMaxVelocity(0, PHYSICS.maxVelocityY);
    
    // Scale bird for better visibility (original sprite is 34x24px)
    this.setScale(1.5);
    this.body.setSize(34, 24);
    
    // Initialize state
    this.isAlive = true;
  }

  /**
   * Make the bird jump when player taps/presses space
   * @param {number} jumpVelocity - Jump velocity from difficulty settings
   */
  jump(jumpVelocity) {
    if (!this.isAlive) return; // Can't jump when dead
    
    // Set upward velocity based on current difficulty
    this.body.setVelocityY(jumpVelocity);
    
    // Optional: slight scale tween for visual feedback
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * Update bird rotation based on velocity
   * Called every frame from GameScene
   */
  update() {
    // Rotate bird based on velocity: up when jumping, down when falling
    const velocityY = this.body.velocity.y;
    const rotation = Phaser.Math.Clamp(velocityY * PHYSICS.rotationSpeed, -30, 90);
    this.angle = rotation;
  }

  /**
   * Handle bird death on collision
   */
  die() {
    this.isAlive = false;
    
    // Stop flapping animation when bird dies
    this.stop();
    
    // Disable physics body
    this.body.enable = false;
    
    // Play death animation: rotate to nose down
    this.scene.tweens.add({
      targets: this,
      angle: 90,
      duration: 500,
      ease: 'Power2'
    });
    
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 800,
      ease: 'Power2'
    });
  }

  /**
   * Respawn bird after death
   */
  respawn() {
    // Reset position
    this.setPosition(GAME_CONFIG.birdStartX, GAME_CONFIG.birdStartY);
    
    // Reset rotation and velocity
    this.angle = 0;
    this.body.velocity.set(0, 0);
    
    // Re-enable physics
    this.body.enable = true;
    
    // Fade in animation
    this.alpha = 0;
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
    
    // Reset state
    this.isAlive = true;
    
    // Restart flapping animation when bird respawns
    this.play('bird-flap');
  }
}
