import { ENEMIES } from '../../game/config/enemies'
import { TOWERS } from '../../game/config/towers'
import { formatDuration, formatNumber, formatSeconds, hexColor } from '../formatters'
import { describeSpecial, strongAgainst } from '../towerText'

describe('towerText', () => {
  it('describes tower specials from their level data', () => {
    expect(describeSpecial(TOWERS.hypernative, TOWERS.hypernative.levels[0])).toBe('Slows to 55% for 2s')
    expect(describeSpecial(TOWERS.multisig, TOWERS.multisig.levels[0])).toBe('Splash 1.1 tiles')
    expect(describeSpecial(TOWERS.recovery, TOWERS.recovery.levels[0])).toBe('+15% damage aura · +12 SAFE per wave')
    expect(describeSpecial(TOWERS.shield, TOWERS.shield.levels[0])).toBe('Reliable single target')
    expect(describeSpecial(TOWERS.simulator, TOWERS.simulator.levels[0])).toBe('Reveals stealth')
  })

  it('lists the attack types an enemy is weak to', () => {
    expect(strongAgainst(ENEMIES.phisher)).toEqual(['Scan'])
    expect(strongAgainst(ENEMIES.blindSigner)).toEqual(['Impact'])
    expect(strongAgainst(ENEMIES.drainer)).toEqual(['Consensus'])
  })
})

describe('formatters', () => {
  it('formats numbers, seconds and durations', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(12345)).toBe('12.3k')
    expect(formatSeconds(4.2)).toBe('5s')
    expect(formatSeconds(75)).toBe('1:15')
    expect(formatDuration(184)).toBe('3:04')
    expect(hexColor(0x12ff80)).toBe('#12ff80')
    expect(hexColor(0x00ff)).toBe('#0000ff')
  })
})
