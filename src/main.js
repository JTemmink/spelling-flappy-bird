import Phaser from 'phaser'
import { DatabaseManager } from './managers/DatabaseManager.js'
import { AuthManager } from './managers/AuthManager.js'
import MenuScene from './scenes/MenuScene.js'
import GameScene from './scenes/GameScene.js'
import GameOverScene from './scenes/GameOverScene.js'

// Initialize managers before Phaser
await DatabaseManager.init()
await AuthManager.init()

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene]
}

// Create and export the game instance
export const game = new Phaser.Game(config)

