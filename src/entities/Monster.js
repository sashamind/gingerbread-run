export class Monster extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 32, 32, 0x8B4513)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(180)

    this.baseSpeed = 155
    this.currentSpeed = this.baseSpeed
    this.isStunned = false

    // Глазки
    this.eyeL = scene.add.rectangle(x - 7, y - 6, 7, 7, 0xffffff, 0.9)
    this.eyeR = scene.add.rectangle(x + 7, y - 6, 7, 7, 0xffffff, 0.9)

    // Ускорение каждые 5 секунд
    scene.time.addEvent({
      delay: 5000,
      callback: this.speedUp,
      callbackScope: this,
      loop: true
    })
  }

  speedUp() {
    if (this.currentSpeed < 240) {
      this.currentSpeed += 10
    }
  }

  chasePlayer(player) {
    if (this.isStunned) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      this.body.setVelocity(
        (dx / dist) * this.currentSpeed,
        (dy / dist) * this.currentSpeed
      )
    }

    this.eyeL.setPosition(this.x - 7, this.y - 6)
    this.eyeR.setPosition(this.x + 7, this.y - 6)
    this.rotation = Math.sin(this.scene.time.now * 0.008) * 0.12
  }

  // Стан от прохожего — долгий
  stun(duration = 2500) {
    if (this.isStunned) return
    this._applyStun(duration)
  }

  // Стан от препятствия — короткий
  stunByObstacle(duration = 400) {
    if (this.isStunned) return
    this._applyStun(duration)
  }

  // Общая логика стана
  _applyStun(duration) {
    this.isStunned = true
    this.body.setVelocity(0, 0)
    this.setFillStyle(0xff4444)

    this.scene.time.delayedCall(duration, () => {
      this.isStunned = false
      this.setFillStyle(0x8B4513)
    })
  }

  destroy() {
    if (this.eyeL) this.eyeL.destroy()
    if (this.eyeR) this.eyeR.destroy()
    super.destroy()
  }
}