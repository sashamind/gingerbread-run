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
    this.isGameOver = false

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)

    this.createGround()

    this.obstacleList = []
    this.spawnObstacles(28)

    this.npcs = this.physics.add.group()
    this.spawnNPCs(10)

    this.player = new Player(this, WORLD_W / 2, WORLD_H / 2)
    this.monster = new Monster(this, WORLD_W / 2 + 280, WORLD_H / 2 + 280)

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)

    this.hud = new HUD(this)

    this.setupCollisions()
    this.showHint()
  }

  // ─── Фон ─────────────────────────────────────────────────
  createGround() {
    const g = this.add.graphics()

    g.fillStyle(0x5a7a3a)
    g.fillRect(0, 0, WORLD_W, WORLD_H)

    g.fillStyle(0xc8a96e, 0.6)
    g.fillRect(0, WORLD_H / 2 - 18, WORLD_W, 36)

    g.fillStyle(0xc8a96e, 0.6)
    g.fillRect(WORLD_W / 2 - 18, 0, 36, WORLD_H)

    g.fillStyle(0x4a6a2a, 0.3)
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, WORLD_W)
      const y = Phaser.Math.Between(0, WORLD_H)
      const r = Phaser.Math.Between(8, 25)
      g.fillCircle(x, y, r)
    }

    g.lineStyle(4, 0x3a5a1a, 1)
    g.strokeRect(2, 2, WORLD_W - 4, WORLD_H - 4)
  }

  // ─── Деревья ─────────────────────────────────────────────
  spawnObstacles(count) {
    const margin = 80
    const centerZone = 180
    const treeColors = [0x2d6a1f, 0x3a8a25, 0x2a7a1a, 0x4a9a30]

    for (let i = 0; i < count; i++) {
      let x, y
      do {
        x = Phaser.Math.Between(margin, WORLD_W - margin)
        y = Phaser.Math.Between(margin, WORLD_H - margin)
      } while (
        Math.abs(x - WORLD_W / 2) < centerZone &&
        Math.abs(y - WORLD_H / 2) < centerZone
      )

      const g = this.add.graphics()

      g.fillStyle(0x8B5E3C)
      g.fillRect(-4, 4, 8, 12)

      g.fillStyle(0x1a4a10, 0.5)
      g.fillCircle(3, 3, 14)

      const color = treeColors[i % treeColors.length]
      g.fillStyle(color)
      g.fillCircle(0, -2, 14)

      g.fillStyle(0x4aaa30, 0.6)
      g.fillCircle(-3, -5, 8)

      g.x = x
      g.y = y

      this.obstacleList.push({ rect: g, x, y, size: 28, alive: true })
    }
  }

  // ─── NPC ─────────────────────────────────────────────────
  spawnNPCs(count) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, WORLD_W - 100)
      const y = Phaser.Math.Between(100, WORLD_H - 100)
      const npc = new NPC(this, x, y)
      this.npcs.add(npc)
    }
  }

  // ─── Коллизии ────────────────────────────────────────────
  setupCollisions() {
    this.physics.add.collider(this.npcs, this.npcs)

    this.physics.add.collider(
      this.monster,
      this.npcs,
      () => { this.monster.stun(2500) }
    )

    this.physics.add.collider(this.player, this.npcs)

    this.physics.add.overlap(this.monster, this.player, () => {
      this.gameOver()
    })
  }

  checkObstacleCollisions() {
    const HALF = 16
    const PLAYER_HALF = 14
    const MONSTER_HALF = 16

    for (const obs of this.obstacleList) {
      if (!obs.alive) continue

      const pdx = Math.abs(this.player.x - obs.x)
      const pdy = Math.abs(this.player.y - obs.y)
      if (pdx < PLAYER_HALF + HALF && pdy < PLAYER_HALF + HALF) {
        this.pushAway(this.player, obs, PLAYER_HALF + HALF)
      }

      const mdx = Math.abs(this.monster.x - obs.x)
      const mdy = Math.abs(this.monster.y - obs.y)
      if (mdx < MONSTER_HALF + HALF && mdy < MONSTER_HALF + HALF) {
        obs.alive = false
        obs.rect.destroy()
        this.monster.stunByObstacle(400)
        this.showBreakEffect(obs.x, obs.y)
      }
    }

    this.obstacleList = this.obstacleList.filter(o => o.alive)
  }

  pushAway(gameObject, obs, minDist) {
    const dx = gameObject.x - obs.x
    const dy = gameObject.y - obs.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    gameObject.x = obs.x + (dx / dist) * minDist
    gameObject.y = obs.y + (dy / dist) * minDist
    if (gameObject.body) {
      gameObject.body.velocity.x *= 0.3
      gameObject.body.velocity.y *= 0.3
    }
  }

  // ─── Эффекты ─────────────────────────────────────────────
  showBreakEffect(x, y) {
    const colors = [0x2d6a1f, 0x4aaa30, 0x1a4a10, 0x8B5E3C]
    for (let i = 0; i < 5; i++) {
      const shard = this.add.rectangle(
        x, y,
        Phaser.Math.Between(4, 12),
        Phaser.Math.Between(4, 12),
        Phaser.Utils.Array.GetRandom(colors)
      )
      const angle = (i / 5) * Math.PI * 2
      const dist = Phaser.Math.Between(25, 60)
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
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200)

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 800,
        onComplete: () => hint.destroy()
      })
    })
  }

  // ─── Конец игры ──────────────────────────────────────────
  gameOver() {
    if (this.isGameOver) return
    this.isGameOver = true

    const score = this.hud.getScore()
    const best = parseInt(localStorage.getItem('bestScore')) || 0
    if (score > best) localStorage.setItem('bestScore', score)

    this.cameras.main.flash(400, 200, 50, 50)
    this.cameras.main.shake(300, 0.015)

    this.time.delayedCall(500, () => {
      this.scene.start('GameOver', { score, best: Math.max(score, best) })
    })
  }

  // ─── Главный цикл ────────────────────────────────────────
  update(time, delta) {
    if (this.isGameOver) return

    this.player.update(this.input.activePointer)
    this.monster.chasePlayer(this.player)
    this.hud.update(delta)
    this.checkObstacleCollisions()
  }
}