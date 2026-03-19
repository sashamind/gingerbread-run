import { Player } from '../entities/Player.js'
import { Monster } from '../entities/Monster.js'
import { NPC } from '../entities/NPC.js'
import { HUD } from '../ui/HUD.js'

const WORLD_W = 1400
const WORLD_H = 1400

// Радиус зависит от размера экрана
function getFogRadius() {
  const isMobile = window.innerWidth < 768
  return isMobile ? 160 : 280
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    this.isGameOver = false

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)

    // Фон — трава
    this.createGround()

    // Препятствия — деревья
    this.obstacleList = []
    this.spawnObstacles(28)

    // Прохожие
    this.npcs = this.physics.add.group()
    this.spawnNPCs(10)

    // Игрок и монстр
    this.player = new Player(this, WORLD_W / 2, WORLD_H / 2)
    this.monster = new Monster(this, WORLD_W / 2 + 280, WORLD_H / 2 + 280)

    // Камера следит за игроком
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)

    // Туман войны
    this.createFog()

    // HUD поверх тумана
    this.hud = new HUD(this)

    this.setupCollisions()
    this.showHint()
  }

  // ─── Фон ─────────────────────────────────────────────────
  createGround() {
    const g = this.add.graphics()

    // Основной зелёный фон
    g.fillStyle(0x5a7a3a)
    g.fillRect(0, 0, WORLD_W, WORLD_H)

    // Грунтовая дорожка горизонтальная
    g.fillStyle(0xc8a96e, 0.6)
    g.fillRect(0, WORLD_H / 2 - 18, WORLD_W, 36)

    // Грунтовая дорожка вертикальная
    g.fillStyle(0xc8a96e, 0.6)
    g.fillRect(WORLD_W / 2 - 18, 0, 36, WORLD_H)

    // Трава — случайные тёмные пятна
    g.fillStyle(0x4a6a2a, 0.3)
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, WORLD_W)
      const y = Phaser.Math.Between(0, WORLD_H)
      const r = Phaser.Math.Between(8, 25)
      g.fillCircle(x, y, r)
    }

    // Граница мира
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

      // Ствол
      g.fillStyle(0x8B5E3C)
      g.fillRect(-4, 4, 8, 12)

      // Тень кроны
      g.fillStyle(0x1a4a10, 0.5)
      g.fillCircle(3, 3, 14)

      // Основная крона
      const color = treeColors[i % treeColors.length]
      g.fillStyle(color)
      g.fillCircle(0, -2, 14)

      // Светлое пятно на кроне
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

  // ─── Туман войны ─────────────────────────────────────────
  createFog() {
  this.fogRadius = getFogRadius() // сохраняем в this
  this._buildFogTexture()

  this.fogSprite = this.add.image(0, 0, 'fog')
  this.fogSprite.setDepth(50)
  this.fogSprite.setScrollFactor(0)
  this.fogSprite.setOrigin(0.5, 0.5)
}

_buildFogTexture() {
  const FOG_R = this.fogRadius  // используем this.fogRadius везде
  const size = Math.max(window.innerWidth, window.innerHeight) * 2.5
  const cx = size / 2
  const cy = size / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(236, 232, 220, 1)'
  ctx.fillRect(0, 0, size, size)

  const innerR = FOG_R * 0.6
  const outerR = FOG_R * 1.4

  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR)
  grad.addColorStop(0,    'rgba(0,0,0, 1)')
  grad.addColorStop(0.4,  'rgba(0,0,0, 0.98)')
  grad.addColorStop(0.65, 'rgba(0,0,0, 0.85)')
  grad.addColorStop(0.82, 'rgba(0,0,0, 0.5)')
  grad.addColorStop(0.93, 'rgba(0,0,0, 0.15)')
  grad.addColorStop(1,    'rgba(0,0,0, 0)')

  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  if (this.textures.exists('fog')) this.textures.remove('fog')
  this.textures.addCanvas('fog', canvas)
}

updateFog() {
  // worldView даёт точные координаты видимой области
  const cam = this.cameras.main

  // Позиция игрока относительно левого верхнего угла камеры
  const sx = this.player.x - cam.worldView.x
  const sy = this.player.y - cam.worldView.y

  this.fogSprite.setPosition(sx, sy)
}

  updateFog() {
    const cam = this.cameras.main

    // Переводим мировые координаты игрока в экранные
    const sx = this.player.x - cam.scrollX
    const sy = this.player.y - cam.scrollY

    // Спрайт следует за игроком по экрану
    this.fogSprite.setPosition(sx, sy)
  }

  // ─── Коллизии ────────────────────────────────────────────
  setupCollisions() {
    this.physics.add.collider(this.npcs, this.npcs)

    // Монстр врезается в NPC — оглушается
    this.physics.add.collider(
      this.monster,
      this.npcs,
      () => { this.monster.stun(2500) }
    )

    this.physics.add.collider(this.player, this.npcs)

    // Монстр догнал игрока — конец игры
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

      // Игрок врезался в дерево — отталкиваем
      const pdx = Math.abs(this.player.x - obs.x)
      const pdy = Math.abs(this.player.y - obs.y)
      if (pdx < PLAYER_HALF + HALF && pdy < PLAYER_HALF + HALF) {
        this.pushAway(this.player, obs, PLAYER_HALF + HALF)
      }

      // Монстр врезался в дерево — ломает его
      const mdx = Math.abs(this.monster.x - obs.x)
      const mdy = Math.abs(this.monster.y - obs.y)
      if (mdx < MONSTER_HALF + HALF && mdy < MONSTER_HALF + HALF) {
        obs.alive = false
        obs.rect.destroy()
        this.monster.stunByObstacle(400)
        this.showBreakEffect(obs.x, obs.y)
      }
    }

    // Убираем сломанные деревья из списка
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
        color: '#333333',
        stroke: '#ffffff',
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

    this.cameras.main.flash(400, 255, 255, 255)
    this.cameras.main.shake(300, 0.015)

    this.time.delayedCall(500, () => {
      this.scene.start('GameOver', { score, best: Math.max(score, best) })
    })
  }

  // ─── Главный цикл ────────────────────────────────────────
  update(time, delta) {
    if (this.isGameOver) return

    // Джойстик убран — только мышь/тач
    this.player.update(this.input.activePointer)
    this.monster.chasePlayer(this.player)
    this.hud.update(delta)

    this.checkObstacleCollisions()
    this.updateFog()
  }
}