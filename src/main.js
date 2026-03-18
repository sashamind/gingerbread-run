import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'

const config = {
  type: Phaser.AUTO,
  // Убираем фиксированные width/height
  // Phaser сам возьмёт размер окна
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,   // ← растягивается под любой экран
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, GameScene, GameOverScene]
}

const game = new Phaser.Game(config)

// Пересчитываем при повороте телефона или ресайзе окна
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight)
})