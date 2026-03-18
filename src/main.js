import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GameOverScene } from './scenes/GameOverScene.js'

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#5a7a3a', // зелёная трава как на скрине
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true  // ← убирает мыльность текста
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
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