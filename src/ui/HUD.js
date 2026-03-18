export class HUD {
  constructor(scene) {
    this.scene = scene

    // Берём реальный размер экрана
    const { width } = scene.scale

    this.timeText = scene.add.text(20, 20, '0 сек', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(10)

    this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0
    this.bestText = scene.add.text(20, 50, `рекорд: ${this.bestScore}с`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setScrollFactor(0).setDepth(10)

    this.elapsed = 0
  }

  update(delta) {
    this.elapsed += delta / 1000
    this.timeText.setText(`${Math.floor(this.elapsed)} сек`)
  }

  getScore() {
    return Math.floor(this.elapsed)
  }
}