export class NPC extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 22, 22, 0x888888)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.body.setCollideWorldBounds(true)
    this.body.setBounce(1) // отскакивают от стен и друг друга

    // Случайная начальная скорость и направление
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const speed = Phaser.Math.Between(40, 90)
    this.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )

    // Смена направления каждые 2-4 секунды
    scene.time.addEvent({
      delay: Phaser.Math.Between(2000, 4000),
      callback: this.changeDirection,
      callbackScope: this,
      loop: true
    })
  }

  changeDirection() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const speed = Phaser.Math.Between(40, 90)
    this.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )
  }
}