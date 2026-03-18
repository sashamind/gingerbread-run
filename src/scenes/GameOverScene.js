export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver')
  }

  init(data) {
    this.score = data.score || 0
    this.best = data.best || 0
  }

  create() {
    // Берём реальный центр экрана
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2
    const isNewRecord = this.score >= this.best

    // Фон на весь экран
    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x1a1a2e)

    // Заголовок
    const title = isNewRecord ? '🏆 РЕКОРД!' : '🍪 ПОЙМАН!'
    this.add.text(cx, cy - 180, title, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: isNewRecord ? '#ffd700' : '#ff6b6b'
    }).setOrigin(0.5)

    // Счёт
    this.add.text(cx, cy - 90, `${this.score} секунд`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Рекорд
    this.add.text(cx, cy - 40, `лучший результат: ${this.best}с`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // Рандомная фраза
    const phrases = [
      'пряник настиг тебя...',
      'от пряника не убежать',
      'сладкое возмездие',
      'пряник доволен 🍪',
      'в следующий раз не ешь сладкое'
    ]
    const phrase = Phaser.Utils.Array.GetRandom(phrases)
    this.add.text(cx, cy + 10, phrase, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#666688',
      fontStyle: 'italic'
    }).setOrigin(0.5)

    // Кнопки
    this.makeButton(cx, cy + 90, '▶  ЕЩЁ РАЗ', 0x4a90d9, () => {
      this.scene.start('Game')
    })

    this.makeButton(cx, cy + 160, '↗  ПОДЕЛИТЬСЯ', 0x2d5a27, () => {
      this.shareScore()
    })
  }

  makeButton(x, y, label, color, callback) {
    const bg = this.add.rectangle(x, y, 220, 48, color, 0.9)
      .setInteractive({ useHandCursor: true })

    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    bg.on('pointerover', () => bg.setAlpha(1))
    bg.on('pointerout', () => bg.setAlpha(0.9))
    bg.on('pointerdown', () => {
      bg.setScale(0.95)
      this.time.delayedCall(100, callback)
    })
    bg.on('pointerup', () => bg.setScale(1))
  }

  shareScore() {
    const text =
      `🍪 Пряник поймал меня через ${this.score} секунд!\n` +
      `Рекорд: ${this.best}с\n` +
      `Сможешь убежать дольше? 👉 [ссылка]`

    if (navigator.share) {
      navigator.share({ title: 'Беги от пряника!', text })
    } else {
      navigator.clipboard.writeText(text).then(() => {
        const msg = this.add.text(
          this.scale.width / 2,
          this.scale.height - 60,
          '✓ скопировано!', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#4a90d9'
        }).setOrigin(0.5)

        this.time.delayedCall(2000, () => msg.destroy())
      })
    }
  }
}