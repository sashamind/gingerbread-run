export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    // Генерируем все текстуры-квадратики прямо в коде
    // Потом заменим на настоящие спрайты

    // Игрок — синий квадрат
    this.makeSquare('player', 0x4a90d9, 28, 28)

    // Монстр-пряник — коричневый квадрат с рожицей
    this.makeSquare('monster', 0x8B4513, 32, 32)

    // Прохожий — серый квадрат
    this.makeSquare('npc', 0x888888, 22, 22)

    // Препятствие — зелёный квадрат
    this.makeSquare('obstacle', 0x2d5a27, 36, 36)

    this.scene.start('Game')
  }

  // Утилита — создаёт текстуру-квадрат
  makeSquare(key, color, width, height) {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(color, 1)
    g.fillRect(0, 0, width, height)
    // Лёгкая обводка для читаемости
    g.lineStyle(1.5, 0xffffff, 0.15)
    g.strokeRect(0, 0, width, height)
    g.generateTexture(key, width, height)
    g.destroy()
  }
}