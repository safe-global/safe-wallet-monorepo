import { ENEMIES } from '../enemies'
import { generateEndlessWave, getWave, TOTAL_WAVES, waveEnemyCounts, waveHpMultiplier, WAVES } from '../waves'

describe('waves', () => {
  it('defines 30 sequentially indexed waves', () => {
    expect(TOTAL_WAVES).toBe(30)
    WAVES.forEach((wave, i) => expect(wave.index).toBe(i + 1))
  })

  it('only references known enemies with positive counts and intervals', () => {
    WAVES.forEach((wave) => {
      expect(wave.groups.length).toBeGreaterThan(0)
      wave.groups.forEach((group) => {
        expect(ENEMIES[group.enemy]).toBeDefined()
        expect(group.count).toBeGreaterThan(0)
        expect(group.interval).toBeGreaterThan(0)
        expect(group.delay).toBeGreaterThanOrEqual(0)
      })
      expect(wave.intel.length).toBeGreaterThan(10)
    })
  })

  it('scales enemy HP monotonically with the wave index', () => {
    for (let i = 2; i <= TOTAL_WAVES; i++) {
      expect(waveHpMultiplier(i)).toBeGreaterThan(waveHpMultiplier(i - 1))
    }
    expect(waveHpMultiplier(1)).toBe(1)
    WAVES.forEach((wave) => expect(wave.hpMultiplier).toBe(waveHpMultiplier(wave.index)))
  })

  it('places a boss on waves 10, 20 and 30', () => {
    ;[10, 20, 30].forEach((index) => {
      const wave = getWave(index)
      expect(wave?.groups.some((g) => ENEMIES[g.enemy].boss)).toBe(true)
    })
    expect(getWave(1)?.groups.some((g) => ENEMIES[g.enemy].boss)).toBe(false)
  })

  it('aggregates enemy counts per wave', () => {
    const counts = waveEnemyCounts({
      index: 99,
      title: 't',
      intel: 'i',
      hpMultiplier: 1,
      groups: [
        { enemy: 'phisher', count: 3, interval: 1, delay: 0 },
        { enemy: 'phisher', count: 2, interval: 1, delay: 5 },
        { enemy: 'drainer', count: 4, interval: 1, delay: 0 },
      ],
    })
    expect(counts).toEqual([
      { enemy: 'phisher', count: 5 },
      { enemy: 'drainer', count: 4 },
    ])
    expect(getWave(0)).toBeUndefined()
    expect(getWave(31)).toBeUndefined()
  })

  it('generates deterministic endless waves past the scripted ones', () => {
    expect(getWave(31, true)).toEqual(generateEndlessWave(31))
    expect(getWave(30, true)).toBe(WAVES[29])
    const w31 = generateEndlessWave(31)
    const w45 = generateEndlessWave(45)
    expect(w31.index).toBe(31)
    expect(w31.hpMultiplier).toBeGreaterThan(waveHpMultiplier(30))
    w31.groups.forEach((group) => expect(ENEMIES[group.enemy]).toBeDefined())
    expect(w31.groups.some((g) => ENEMIES[g.enemy].boss)).toBe(false)
    expect(generateEndlessWave(35).groups.some((g) => ENEMIES[g.enemy].boss)).toBe(true)
    const total = (wave: typeof w31): number => wave.groups.reduce((sum, g) => sum + g.count, 0)
    expect(total(w45)).toBeGreaterThan(total(w31))
  })
})
