import { armorReduction, computeDamage, DAMAGE_TABLE } from '../combat'
import { ENEMIES } from '../enemies'
import { sellValue, totalInvested, TOWER_ORDER, TOWERS } from '../towers'

describe('combat', () => {
  it('reduces damage with diminishing returns per armor point', () => {
    expect(armorReduction(0)).toBe(0)
    expect(armorReduction(5)).toBeGreaterThan(armorReduction(4))
    expect(armorReduction(100)).toBeLessThan(1)
    expect(armorReduction(1)).toBeCloseTo(0.0566, 3)
  })

  it('applies the attack/armor table', () => {
    expect(computeDamage(100, 'scan', 'unarmored', 0)).toBe(125)
    expect(computeDamage(100, 'impact', 'heavy', 0)).toBeCloseTo(140)
    expect(computeDamage(100, 'magic', 'light', 0)).toBe(125)
    expect(computeDamage(100, 'scan', 'heavy', 0)).toBeLessThan(computeDamage(100, 'impact', 'heavy', 0))
    expect(computeDamage(100, 'scan', 'unarmored', 0, 1.5)).toBe(187.5)
  })

  it('never returns negative damage', () => {
    expect(computeDamage(0, 'scan', 'fortified', 12)).toBe(0)
    Object.values(DAMAGE_TABLE).forEach((row) => Object.values(row).forEach((m) => expect(m).toBeGreaterThan(0)))
  })
})

describe('towers', () => {
  it('has unique hotkeys and three increasingly expensive levels', () => {
    const hotkeys = TOWER_ORDER.map((id) => TOWERS[id].hotkey)
    expect(new Set(hotkeys).size).toBe(hotkeys.length)
    TOWER_ORDER.forEach((id) => {
      const levels = TOWERS[id].levels
      expect(levels).toHaveLength(3)
      expect(levels[1].cost).toBeGreaterThan(0)
      expect(levels[2].cost).toBeGreaterThan(levels[1].cost)
      expect(levels[2].range).toBeGreaterThanOrEqual(levels[0].range)
      if (TOWERS[id].targets !== 'none') expect(levels[2].damage).toBeGreaterThanOrEqual(levels[0].damage)
    })
  })

  it('refunds 70% of everything invested', () => {
    expect(totalInvested('shield', 1)).toBe(60)
    expect(totalInvested('shield', 3)).toBe(60 + 70 + 110)
    expect(sellValue('shield', 3)).toBe(Math.floor(240 * 0.7))
  })
})

describe('enemies', () => {
  it('references only known split and summon targets', () => {
    Object.values(ENEMIES).forEach((enemy) => {
      if (enemy.splitsInto) expect(ENEMIES[enemy.splitsInto.enemy]).toBeDefined()
      if (enemy.summons) expect(ENEMIES[enemy.summons.enemy]).toBeDefined()
      expect(enemy.hp).toBeGreaterThan(0)
      expect(enemy.speed).toBeGreaterThan(0)
      expect(enemy.drain).toBeGreaterThan(0)
    })
  })
})
