import { Player } from '../entities/Player.js'
import { Monster } from '../entities/Monster.js'
import { NPC } from '../entities/NPC.js'
import { HUD } from '../ui/HUD.js'

const WORLD_W = 1400
const WORLD_H = 1400

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    // Сбрасываем флаг game over при каждом старте
    this.isGameOver = false

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.createGrid()

    // Препятствия — простой массив, проверяем вручную
    this.obstacleList = []
    this.spawnObstacles(18)

    // Прохожие
    this.npcs = this.physics.add.group()
    this.spawnNPCs(12)

    // Игрок и монстр
    this.player = new Player(this, WORLD_W / 2, WORLD_H / 2)
    this.monster = new Monster(this, WORLD_W / 2 + 250, WORLD_H / 2 + 250)

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)

    this.hud = new HUD(this)

    // Только те коллизии которые не вызывают проблем
    this.setupCollisions()
    this.showHint()
  }

  createGrid() {
    const g = this.add.graphics()
    g.lineStyle(1, 0x333355, 0.4)
    const step = 60
    for (let x = 0; x <= WORLD_W; x += step) {
      g.lineBetween(x, 0, x, WORLD_H)
    }
    for (let y = 0; y <= WORLD_H; y += step) {
      g.lineBetween(0, y, WORLD_W, y)
    }
    g.lineStyle(3, 0x6666aa, 0.6)
    g.strokeRect(0, 0, WORLD_W, WORLD_H)
  }

  spawnObstacles(count) {
    const margin = 80
    const centerZone = 200

    for (let i = 0; i < count; i++) {
      let x, y

      do {
        x = Phaser.Math.Between(margin, WORLD_W - margin)
        y = Phaser.Math.Between(margin, WORLD_H - margin)
      } while (
        Math.abs(x - WORLD_W / 2) < centerZone &&
        Math.abs(y - WORLD_H / 2) < centerZone
      )

      // Просто визуальный квадрат — без физики Phaser
      const rect = this.add.rectangle(x, y, 36, 36, 0x2d5a27)

      // Храним данные препятствия в простом объекте
      this.obstacleList.push({
        rect,
        x,
        y,
        size: 36,
        alive: true
      })
    }
  }

  spawnNPCs(count) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, WORLD_W - 100)
      const y = Phaser.Math.Between(100, WORLD_H - 100)
      const npc = new NPC(this, x, y)
      this.npcs.add(npc)
    }
  }

  setupCollisions() {
    // Прохожие между собой
    this.physics.add.collider(this.npcs, this.npcs)

    // Монстр + прохожий → долгий стан
    this.physics.add.collider(
      this.monster,
      this.npcs,
      () => {
        this.monster.stun(2500)
      }
    )

    // Игрок + прохожий → замедление
    this.physics.add.collider(this.player, this.npcs)

    // Монстр догнал игрока → Game Over
    this.physics.add.overlap(this.monster, this.player, () => {
      this.gameOver()
    })
  }

  // Проверяем столкновения вручную в update()
  checkObstacleCollisions() {
    const HALF = 18 // половина размера препятствия (36/2)
    const PLAYER_HALF = 14
    const MONSTER_HALF = 16

    for (const obs of this.obstacleList) {
      if (!obs.alive) continue

      // --- Игрок и препятствие ---
      // Простая проверка AABB (прямоугольники пересекаются?)
      const pdx = Math.abs(this.player.x - obs.x)
      const pdy = Math.abs(this.player.y - obs.y)

      if (pdx < PLAYER_HALF + HALF && pdy < PLAYER_HALF + HALF) {
        // Отталкиваем игрока от препятствия
        this.pushAway(this.player, obs, PLAYER_HALF + HALF)
      }

      // --- Монстр и препятствие ---
      const mdx = Math.abs(this.monster.x - obs.x)
      const mdy = Math.abs(this.monster.y - obs.y)

      if (mdx < MONSTER_HALF + HALF && mdy < MONSTER_HALF + HALF) {
        // Уничтожаем препятствие
        obs.alive = false
        obs.rect.destroy()

        // Стан монстра
        this.monster.stunByObstacle(400)

        // Эффект разрушения
        this.showBreakEffect(obs.x, obs.y)
      }
    }

    // Убираем уничтоженные из массива
    this.obstacleList = this.obstacleList.filter(o => o.alive)
  }

  // Отталкиваем объект от препятствия
  pushAway(gameObject, obs, minDist) {
    const dx = gameObject.x - obs.x
    const dy = gameObject.y - obs.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    // Сдвигаем ровно до края препятствия
    gameObject.x = obs.x + (dx / dist) * minDist
    gameObject.y = obs.y + (dy / dist) * minDist

    // Гасим скорость в направлении препятствия
    if (gameObject.body) {
      gameObject.body.velocity.x *= 0.3
      gameObject.body.velocity.y *= 0.3
    }
  }

  showBreakEffect(x, y) {
    const colors = [0x2d5a27, 0x4a8a3f, 0x1a3a17]

    for (let i = 0; i < 4; i++) {
      const shard = this.add.rectangle(
        x, y,
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(6, 14),
        Phaser.Utils.Array.GetRandom(colors)
      )

      const angle = (i / 4) * Math.PI * 2
      const dist = Phaser.Math.Between(30, 70)

      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => shard.destroy()
      })
    }
  }

  showHint() {
    const hint = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 120,
      '🏃 веди курсором!\n🍪 пряник догоняет...',
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10)

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 800,
        onComplete: () => hint.destroy()
      })
    })
  }

  gameOver() {
    if (this.isGameOver) return
    this.isGameOver = true

    const score = this.hud.getScore()
    const best = parseInt(localStorage.getItem('bestScore')) || 0
    if (score > best) {
      localStorage.setItem('bestScore', score)
    }

    this.cameras.main.flash(400, 200, 50, 50)
    this.cameras.main.shake(300, 0.015)

    this.time.delayedCall(500, () => {
      this.scene.start('GameOver', { score, best: Math.max(score, best) })
    })
  }

  update(time, delta) {
    if (this.isGameOver) return

    this.player.update(this.input.activePointer)
    this.monster.chasePlayer(this.player)
    this.hud.update(delta)

    // Проверяем столкновения с препятствиями вручную
    this.checkObstacleCollisions()
  }
}