export class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 28, 28, 0x4a90d9)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Физика
    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(220)
    this.body.setDamping(true)
    this.body.setDrag(0.88)

    // Параметры
    this.speed = 320
    this.isMoving = false

    // Маленький белый квадрат — "глаз" для направления
    this.eye = scene.add.rectangle(x + 6, y - 4, 6, 6, 0xffffff, 0.8)
  }

  update(pointer) {
    const dx = pointer.worldX - this.x
    const dy = pointer.worldY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Мёртвая зона — курсор рядом, стоим
    if (dist < 15) {
      this.body.setVelocity(0, 0)
      this.isMoving = false
      return
    }

    // Скорость зависит от расстояния до курсора
    // Далеко = быстро, близко = медленно (плавно)
    const speedMultiplier = Phaser.Math.Clamp(dist / 100, 0.3, 1)
    const vx = (dx / dist) * this.speed * speedMultiplier
    const vy = (dy / dist) * this.speed * speedMultiplier

    this.body.setVelocity(vx, vy)
    this.isMoving = true

    // "Глаз" следует за персонажем
    this.eye.setPosition(
      this.x + (dx / dist) * 7,
      this.y + (dy / dist) * 7
    )

    // Лёгкий наклон в сторону движения
    this.rotation = (dx / dist) * 0.15
  }

  destroy() {
    this.eye.destroy()
    super.destroy()
  }
}