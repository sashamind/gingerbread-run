import { Player } from '../entities/Player.js'
import { Monster } from '../entities/Monster.js'
import { NPC } from '../entities/NPC.js'
import { HUD } from '../ui/HUD.js'

const WORLD_W = 1400
const WORLD_H = 1400
const FOG_RADIUS = 320 // радиус видимости вокруг игрока

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

    // Камера
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)

    // Туман войны — рисуется поверх всего
    this.createFog()

    // HUD поверх тумана
    this.hud = new HUD(this)

    // Джойстик
    this.createJoystick()

    this.setupCollisions()
    this.showHint()
  }

  // Трава + грунтовые дорожки
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

  // Деревья вместо квадратов
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

    // Основная крона — случайный оттенок зелёного
    const color = treeColors[i % treeColors.length]
    g.fillStyle(color)
    g.fillCircle(0, -2, 14)

    // Светлое пятно
    g.fillStyle(0x4aaa30, 0.6)
    g.fillCircle(-3, -5, 8)

    g.x = x
    g.y = y

    this.obstacleList.push({
      rect: g,
      x, y,
      size: 28,
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

  // Туман войны — чёрная маска с дыркой вокруг игрока
  createFog() {
    // Отдельная камера для тумана не нужна
    // Рисуем через RenderTexture поверх всей сцены
    this.fogTexture = this.add
      .renderTexture(0, 0, WORLD_W, WORLD_H)
      .setDepth(50)    // поверх всех объектов
      .setScrollFactor(1) // двигается вместе с камерой

    // Кисть для "дырки" в тумане
    this.fogBrush = this.make.graphics({ x: 0, y: 0, add: false })
  }

  updateFog() {
    const px = this.player.x
    const py = this.player.y
    const r = FOG_RADIUS

    // Заливаем туман
    this.fogTexture.clear()
    this.fogTexture.fill(0x000000, 0.82)

    // Вырезаем круг видимости через blendMode ERASE
    this.fogBrush.clear()
    this.fogBrush.fillStyle(0xffffff)

    // Градиентный край — несколько кругов с убыванием прозрачности
    for (let i = 0; i < 6; i++) {
      const alpha = 1 - i * 0.18
      const radius = r - i * 18
      this.fogBrush.fillStyle(0xffffff, alpha)
      this.fogBrush.fillCircle(px, py, radius)
    }

    this.fogTexture.erase(this.fogBrush, 0, 0)
  }

  // Джойстик для мобилки
  createJoystick() {
    this.joystick = {
      active: false,
      baseX: 0,
      baseY: 0,
      stickX: 0,
      stickY: 0,
      dx: 0,
      dy: 0,
      pointerId: null
    }

    // Визуал джойстика
    const jg = this.add.graphics()
    this.joystickGraphics = jg
    this.joystickGraphics.setDepth(100).setScrollFactor(0)

    // Слушаем тач
    this.input.on('pointerdown', (p) => {
      // Джойстик только если тап в левой половине экрана
      if (p.x < this.scale.width / 2) {
        this.joystick.active = true
        this.joystick.pointerId = p.id
        this.joystick.baseX = p.x
        this.joystick.baseY = p.y
        this.joystick.stickX = p.x
        this.joystick.stickY = p.y
      }
    })

    this.input.on('pointermove', (p) => {
      if (this.joystick.active && p.id === this.joystick.pointerId) {
        const dx = p.x - this.joystick.baseX
        const dy = p.y - this.joystick.baseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 55

        if (dist > maxDist) {
          this.joystick.stickX = this.joystick.baseX + (dx / dist) * maxDist
          this.joystick.stickY = this.joystick.baseY + (dy / dist) * maxDist
        } else {
          this.joystick.stickX = p.x
          this.joystick.stickY = p.y
        }

        // Нормализованное направление
        this.joystick.dx = (this.joystick.stickX - this.joystick.baseX) / maxDist
        this.joystick.dy = (this.joystick.stickY - this.joystick.baseY) / maxDist
      }
    })

    this.input.on('pointerup', (p) => {
      if (p.id === this.joystick.pointerId) {
        this.joystick.active = false
        this.joystick.dx = 0
        this.joystick.dy = 0
        this.joystickGraphics.clear()
      }
    })
  }

  drawJoystick() {
    if (!this.joystick.active) return

    const g = this.joystickGraphics
    g.clear()

    const bx = this.joystick.baseX
    const by = this.joystick.baseY
    const sx = this.joystick.stickX
    const sy = this.joystick.stickY

    // База
    g.fillStyle(0xffffff, 0.15)
    g.fillCircle(bx, by, 55)
    g.lineStyle(2, 0xffffff, 0.3)
    g.strokeCircle(bx, by, 55)

    // Стик
    g.fillStyle(0xffffff, 0.35)
    g.fillCircle(sx, sy, 26)
    g.lineStyle(2, 0xffffff, 0.5)
    g.strokeCircle(sx, sy, 26)
  }

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
      '🏃 веди курсором / джойстик!\n🍪 пряник догоняет...',
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

  update(time, delta) {
    if (this.isGameOver) return

    // Передаём джойстик в player
    this.player.update(this.input.activePointer, this.joystick)
    this.monster.chasePlayer(this.player)
    this.hud.update(delta)

    this.checkObstacleCollisions()

    // Обновляем туман и джойстик каждый кадр
    this.updateFog()
    this.drawJoystick()
  }
}