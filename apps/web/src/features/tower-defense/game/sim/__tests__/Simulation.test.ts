import { DIFFICULTIES } from '../../config/difficulty'
import { ENEMIES } from '../../config/enemies'
import { MAP, spawnCell, vaultCell } from '../../config/map'
import { TOWERS } from '../../config/towers'
import { TOTAL_WAVES } from '../../config/waves'
import { Simulation } from '../Simulation'
import type { SimEvent } from '../types'

const STEP = 1 / 60

const advance = (sim: Simulation, seconds: number): SimEvent[] => {
  const events: SimEvent[] = []
  const steps = Math.round(seconds / STEP)
  for (let i = 0; i < steps; i++) {
    sim.step(STEP)
    events.push(...sim.drainEvents())
  }
  return events
}

/** A free tile right next to the first path segment (path runs along row 2 from c=0..6). */
const NEAR_PATH = { c: 3, r: 3 }
const FAR_FROM_PATH = { c: 21, r: 8 }

describe('Simulation', () => {
  describe('building', () => {
    it('starts with the difficulty budget and treasury', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      expect(sim.gold).toBe(DIFFICULTIES.mainnet.startingGold)
      expect(sim.treasury).toBe(DIFFICULTIES.mainnet.treasury)
      expect(sim.phase).toBe('building')
      expect(sim.waveCountdown).toBe(DIFFICULTIES.mainnet.buildTime)
    })

    it('refuses towers on the path, decor, spawn, vault, outside the map and when broke', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      expect(sim.canPlace('shield', { c: 1, r: 2 })).toEqual({ ok: false, reason: 'path' })
      expect(sim.canPlace('shield', MAP.decor[0])).toEqual({ ok: false, reason: 'blocked' })
      expect(sim.canPlace('shield', spawnCell(MAP))).toEqual({ ok: false, reason: 'path' })
      expect(sim.canPlace('shield', vaultCell(MAP))).toEqual({ ok: false, reason: 'path' })
      expect(sim.canPlace('shield', { c: -1, r: 0 })).toEqual({ ok: false, reason: 'outside' })
      expect(sim.canPlace('shield', NEAR_PATH)).toEqual({ ok: true })
      sim.gold = 10
      expect(sim.canPlace('shield', NEAR_PATH)).toEqual({ ok: false, reason: 'gold' })
    })

    it('charges for placement, blocks the cell and emits a build event', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      const tower = sim.placeTower('shield', NEAR_PATH)
      expect(tower?.level).toBe(1)
      expect(sim.gold).toBe(DIFFICULTIES.mainnet.startingGold - TOWERS.shield.levels[0].cost)
      expect(sim.getTowerAt(NEAR_PATH)?.uid).toBe(tower?.uid)
      expect(sim.canPlace('shield', NEAR_PATH)).toEqual({ ok: false, reason: 'occupied' })
      expect(sim.drainEvents()).toEqual([expect.objectContaining({ type: 'build', towerId: 'shield' })])
      expect(sim.placeTower('shield', NEAR_PATH)).toBeUndefined()
    })

    it('upgrades up to level 3 and sells for 70% of the investment', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.gold = 1000
      const tower = sim.placeTower('shield', NEAR_PATH)
      if (!tower) throw new Error('tower not placed')
      expect(sim.upgradeTower(tower.uid)).toBe(true)
      expect(sim.upgradeTower(tower.uid)).toBe(true)
      expect(tower.level).toBe(3)
      expect(sim.upgradeCost(tower)).toBeNull()
      expect(sim.upgradeTower(tower.uid)).toBe(false)
      expect(sim.gold).toBe(1000 - 60 - 70 - 110)
      const refund = sim.sellTower(tower.uid)
      expect(refund).toBe(Math.floor(240 * 0.7))
      expect(sim.gold).toBe(1000 - 240 + refund)
      expect(sim.towers.size).toBe(0)
      expect(sim.getTowerAt(NEAR_PATH)).toBeUndefined()
    })

    it('does not upgrade without enough SAFE', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      const tower = sim.placeTower('shield', NEAR_PATH)
      if (!tower) throw new Error('tower not placed')
      sim.gold = 0
      expect(sim.upgradeTower(tower.uid)).toBe(false)
      expect(tower.level).toBe(1)
    })
  })

  describe('waves', () => {
    it('starts the first wave when the build timer runs out', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      advance(sim, DIFFICULTIES.mainnet.buildTime - 1)
      expect(sim.waveIndex).toBe(0)
      const events = advance(sim, 1.5)
      expect(sim.waveIndex).toBe(1)
      expect(sim.phase).toBe('wave')
      expect(events).toContainEqual(expect.objectContaining({ type: 'waveStart', index: 1 }))
    })

    it('spawns the wave over time at the portal', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      expect(sim.callNextWave()).toBe(true)
      const events = advance(sim, 0.1)
      expect(events).toContainEqual(expect.objectContaining({ type: 'spawn', enemyId: 'phisher' }))
      expect(sim.enemies.size).toBe(1)
      advance(sim, 7.1)
      expect(sim.enemies.size).toBe(8)
      expect(sim.isSpawning).toBe(false)
      const first = Array.from(sim.enemies.values())[0]
      expect(first.dist).toBeGreaterThan(0)
      expect(first.maxHp).toBe(ENEMIES.phisher.hp)
    })

    it('cannot call the next wave while the current one is still spawning', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.callNextWave()
      advance(sim, 1)
      expect(sim.canCallNextWave).toBe(false)
      expect(sim.callNextWave()).toBe(false)
      advance(sim, 8)
      expect(sim.canCallNextWave).toBe(true)
    })

    it('pays a bonus for calling a wave early', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.callNextWave()
      advance(sim, 8)
      const gold = sim.gold
      const remaining = sim.waveCountdown ?? 0
      expect(remaining).toBeGreaterThan(5)
      sim.callNextWave()
      expect(sim.gold).toBe(gold + Math.floor(remaining * 1.5))
      expect(sim.waveIndex).toBe(2)
    })

    it('drains the treasury when attackers reach the vault and loses at zero', () => {
      const sim = new Simulation({ difficulty: 'darkForest' })
      sim.callNextWave()
      const events = advance(sim, 60)
      expect(events).toContainEqual(expect.objectContaining({ type: 'leak', enemyId: 'phisher', drain: 1 }))
      expect(sim.treasury).toBeLessThan(DIFFICULTIES.darkForest.treasury)
      expect(sim.leaked).toBeGreaterThan(0)
      sim.treasury = 1
      for (let wave = 0; wave < 3 && sim.phase !== 'lost'; wave++) {
        if (sim.canCallNextWave) sim.callNextWave()
        advance(sim, 60)
      }
      expect(sim.phase).toBe('lost')
      const time = sim.time
      sim.step(STEP)
      expect(sim.time).toBe(time)
    })
  })

  describe('combat', () => {
    it('towers shoot attackers in range, earn bounty and clear the wave', () => {
      const sim = new Simulation({ difficulty: 'testnet' })
      sim.gold = 5000
      ;[1, 2, 3, 4, 5].forEach((c) => {
        sim.placeTower('shield', { c, r: 1 })
        sim.placeTower('shield', { c, r: 3 })
        sim.placeTower('multisig', { c, r: 4 })
      })
      const goldBefore = sim.gold
      sim.callNextWave()
      const events = advance(sim, 30)
      expect(events).toContainEqual(expect.objectContaining({ type: 'shot', towerId: 'shield' }))
      expect(events).toContainEqual(expect.objectContaining({ type: 'hit' }))
      expect(events).toContainEqual(expect.objectContaining({ type: 'death', enemyId: 'phisher' }))
      expect(events).toContainEqual(expect.objectContaining({ type: 'waveCleared', index: 1 }))
      expect(sim.kills).toBe(8)
      expect(sim.leaked).toBe(0)
      expect(sim.gold).toBeGreaterThan(goldBefore)
      expect(sim.phase).toBe('building')
      expect(sim.wavesCleared).toBe(1)
      const tower = Array.from(sim.towers.values()).find((t) => t.kills > 0)
      expect(tower?.damageDealt).toBeGreaterThan(0)
    })

    it('cannons ignore air units and stealth units need a detector', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.gold = 5000
      const cannon = sim.placeTower('multisig', NEAR_PATH)
      const shield = sim.placeTower('shield', { c: 2, r: 3 })
      if (!cannon || !shield) throw new Error('towers not placed')
      const spawnEnemy = (
        sim as unknown as { spawnEnemy: (id: string, mult: number, dist: number) => unknown }
      ).spawnEnemy.bind(sim)
      spawnEnemy('mevBot', 1, 0)
      spawnEnemy('socialEngineer', 1, 2.5)
      const [flyer, sneaky] = Array.from(sim.enemies.values())
      expect(sim.isTargetable(cannon, flyer)).toBe(false)
      expect(sim.isTargetable(shield, flyer)).toBe(true)
      expect(sim.isTargetable(shield, sneaky)).toBe(false)
      sim.placeTower('simulator', { c: 3, r: 1 })
      sim.step(STEP)
      expect(sim.isTargetable(shield, sneaky)).toBe(true)
    })

    it('shields absorb hits before health is touched', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      const spawnEnemy = (
        sim as unknown as { spawnEnemy: (id: string, mult: number, dist: number) => unknown }
      ).spawnEnemy.bind(sim)
      spawnEnemy('spoofedUi', 1, 0)
      const enemy = Array.from(sim.enemies.values())[0]
      expect(enemy.shieldHits).toBe(4)
      expect(sim.applyDamage(enemy, 50, null, 1)).toBe(0)
      expect(enemy.hp).toBe(enemy.maxHp)
      expect(enemy.shieldHits).toBe(3)
      for (let i = 0; i < 3; i++) sim.applyDamage(enemy, 50, null, 1)
      expect(sim.applyDamage(enemy, 50, null, 1)).toBeGreaterThan(0)
      expect(enemy.hp).toBeLessThan(enemy.maxHp)
      expect(sim.drainEvents().filter((e) => e.type === 'shieldBlock')).toHaveLength(4)
    })

    it('splits poisoners into dust when they die', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      const spawnEnemy = (
        sim as unknown as { spawnEnemy: (id: string, mult: number, dist: number) => unknown }
      ).spawnEnemy.bind(sim)
      spawnEnemy('poisoner', 1, 4)
      const enemy = Array.from(sim.enemies.values())[0]
      const gold = sim.gold
      sim.applyDamage(enemy, 1e6, null, 1)
      expect(sim.enemies.size).toBe(3)
      Array.from(sim.enemies.values()).forEach((e) => expect(e.def.id).toBe('dust'))
      expect(sim.kills).toBe(1)
      expect(sim.gold).toBe(gold + ENEMIES.poisoner.bounty)
    })

    it('recovery modules boost nearby towers and pay income when a wave is cleared', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.gold = 5000
      const shield = sim.placeTower('shield', NEAR_PATH)
      sim.placeTower('recovery', { c: 4, r: 3 })
      if (!shield) throw new Error('tower not placed')
      expect(sim.auraBonus(shield)).toBeCloseTo(1.15)
      const far = sim.placeTower('shield', FAR_FROM_PATH)
      if (!far) throw new Error('tower not placed')
      expect(sim.auraBonus(far)).toBe(1)
      ;[1, 2, 4, 5].forEach((c) => {
        sim.placeTower('shield', { c, r: 1 })
        sim.placeTower('multisig', { c, r: 3 })
      })
      const goldBefore = sim.gold
      sim.callNextWave()
      const events = advance(sim, 30)
      const cleared = events.find((e) => e.type === 'waveCleared')
      expect(cleared).toBeDefined()
      if (cleared?.type === 'waveCleared') {
        expect(cleared.income).toBe(TOWERS.recovery.levels[0].income)
        expect(sim.gold).toBeGreaterThanOrEqual(goldBefore + cleared.bonus + cleared.income)
      }
    })
  })

  describe('targeting modes', () => {
    const spawnAt = (sim: Simulation, id: string, dist: number, hpScale = 1) => {
      const spawnEnemy = (
        sim as unknown as { spawnEnemy: (id: string, mult: number, wave: number, dist: number) => { uid: number } }
      ).spawnEnemy.bind(sim)
      return spawnEnemy(id, hpScale, 1, dist)
    }

    it('picks first, strongest, weakest or closest attackers', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      const tower = sim.placeTower('shield', NEAR_PATH)
      if (!tower) throw new Error('tower not placed')
      const weakFar = spawnAt(sim, 'phisher', 4.4, 0.5)
      const strongNear = spawnAt(sim, 'blindSigner', 2.6, 1)
      const midLead = spawnAt(sim, 'drainer', 5.2, 1)
      const all = Array.from(sim.enemies.values())
      expect(sim.pickTarget(tower, all)?.uid).toBe(midLead.uid)
      sim.setTargeting(tower.uid, 'strongest')
      expect(tower.targeting).toBe('strongest')
      expect(tower.targetUid).toBeNull()
      expect(sim.pickTarget(tower, all)?.uid).toBe(strongNear.uid)
      sim.setTargeting(tower.uid, 'weakest')
      expect(sim.pickTarget(tower, all)?.uid).toBe(weakFar.uid)
      sim.setTargeting(tower.uid, 'closest')
      const closest = all.reduce((best, e) =>
        Math.hypot(e.pos.x - tower.pos.x, e.pos.z - tower.pos.z) <
        Math.hypot(best.pos.x - tower.pos.x, best.pos.z - tower.pos.z)
          ? e
          : best,
      )
      expect(sim.pickTarget(tower, all)?.uid).toBe(closest.uid)
      expect(sim.pickTarget(tower, [])).toBeUndefined()
      expect(sim.setTargeting(999, 'first')).toBe(false)
    })
  })

  describe('endless mode', () => {
    it('continues past wave 30 with generated waves and no victory', () => {
      const sim = new Simulation({ difficulty: 'testnet' })
      sim.gold = 1e9
      let guard = 0
      const killEverything = (): void => {
        for (const enemy of Array.from(sim.enemies.values())) {
          enemy.shieldHits = 0
          sim.applyDamage(enemy, 1e9, null, 1)
        }
      }
      while (sim.phase !== 'won' && guard++ < 100000) {
        if (sim.canCallNextWave) sim.callNextWave()
        sim.step(STEP)
        sim.drainEvents()
        killEverything()
      }
      expect(sim.phase).toBe('won')
      expect(sim.continueEndless()).toBe(true)
      expect(sim.continueEndless()).toBe(false)
      expect(sim.endless).toBe(true)
      expect(sim.phase).toBe('building')
      expect(sim.totalWaves).toBe(Infinity)
      expect(sim.canCallNextWave).toBe(true)
      sim.callNextWave()
      expect(sim.waveIndex).toBe(31)
      const events = advance(sim, 1)
      expect(events).toContainEqual(expect.objectContaining({ type: 'waveStart', index: 31 }))
      guard = 0
      while (sim.wavesCleared < 31 && guard++ < 20000) {
        sim.step(STEP)
        sim.drainEvents()
        killEverything()
      }
      expect(sim.wavesCleared).toBe(31)
      expect(sim.phase).not.toBe('won')
      expect(sim.waveCountdown).not.toBeNull()
    })
  })

  describe('wave progress', () => {
    it('reports queued, alive and finished attackers per wave', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      expect(sim.waveProgress(1)).toBeNull()
      sim.callNextWave()
      advance(sim, 2.1)
      expect(sim.waveProgress(1)).toEqual({ total: 8, queued: 5, alive: 3, done: 0 })
      const first = Array.from(sim.enemies.values())[0]
      sim.applyDamage(first, 1e9, null, 1)
      expect(sim.waveProgress(1)).toEqual({ total: 8, queued: 5, alive: 2, done: 1 })
      advance(sim, 6)
      expect(sim.waveProgress(1)?.queued).toBe(0)
      expect(sim.waveProgress(1)?.alive).toBe(7)
    })
  })

  describe('overlapping waves', () => {
    it('clears each wave independently when its last attacker is gone', () => {
      const sim = new Simulation({ difficulty: 'mainnet' })
      sim.callNextWave()
      advance(sim, 8)
      sim.callNextWave()
      expect(sim.waveIndex).toBe(2)
      const events = advance(sim, 120)
      const cleared = events
        .filter((e) => e.type === 'waveCleared')
        .map((e) => (e.type === 'waveCleared' ? e.index : 0))
      expect(cleared).toEqual([1, 2])
      expect(sim.wavesCleared).toBe(2)
    })
  })

  describe('winning', () => {
    it('wins after clearing the final wave', () => {
      const sim = new Simulation({ difficulty: 'testnet' })
      sim.gold = 1e9
      let guard = 0
      while (sim.phase !== 'won' && guard++ < 100000) {
        if (sim.canCallNextWave) sim.callNextWave()
        sim.step(STEP)
        sim.drainEvents()
        for (const enemy of Array.from(sim.enemies.values())) {
          enemy.shieldHits = 0
          sim.applyDamage(enemy, 1e9, null, 1)
        }
      }
      expect(sim.phase).toBe('won')
      expect(sim.waveIndex).toBe(TOTAL_WAVES)
      expect(sim.wavesCleared).toBe(TOTAL_WAVES)
      expect(sim.leaked).toBe(0)
      expect(sim.waveCountdown).toBeNull()
      expect(sim.score).toBeGreaterThan(TOTAL_WAVES * 100)
      expect(sim.canPlace('shield', NEAR_PATH)).toEqual({ ok: false, reason: 'phase' })
    })
  })
})
