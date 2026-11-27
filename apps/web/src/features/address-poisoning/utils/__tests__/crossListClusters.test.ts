import { bandGroupsForList, buildSimilarWarnings } from '../crossListClusters'

const item = (address: string, chainId = '1') => ({ address, chainId })
const peer = (address: string, chainIds = ['1']) => ({ address, chainIds })

describe('bandGroupsForList', () => {
  it('maps only the addresses that belong to a cluster, lowercased', () => {
    const groups = new Map([
      ['0xaaa', 'g1'],
      ['0xbbb', 'g1'],
    ])
    const result = bandGroupsForList([item('0xAAA'), item('0xBBB'), item('0xCCC')], groups)

    expect([...result]).toEqual([
      ['0xaaa', 'g1'],
      ['0xbbb', 'g1'],
    ])
  })

  it('dedupes a multi-chain safe (same address on several rows) into one entry', () => {
    const groups = new Map([['0xaaa', 'g1']])
    const result = bandGroupsForList([item('0xAAA'), item('0xaaa')], groups)

    expect(result.size).toBe(1)
    expect(result.get('0xaaa')).toBe('g1')
  })

  it('returns an empty map when nothing is clustered', () => {
    expect(bandGroupsForList([item('0xAAA')], new Map()).size).toBe(0)
  })
})

describe('buildSimilarWarnings', () => {
  it('warns both sides of a cluster that spans the two lists, pointing at each other', () => {
    const groups = new Map([
      ['0xtrusted', 'g1'],
      ['0xowned', 'g1'],
    ])
    const result = buildSimilarWarnings([item('0xTrusted')], [item('0xOwned')], groups)

    expect(result.get('0xtrusted')).toEqual({ trusted: [], owned: [peer('0xowned')] })
    expect(result.get('0xowned')).toEqual({ trusted: [peer('0xtrusted')], owned: [] })
  })

  it('ignores a cluster living entirely in one list (no cross-list warning)', () => {
    const groups = new Map([
      ['0xowned1', 'g1'],
      ['0xowned2', 'g1'],
    ])
    const result = buildSimilarWarnings([], [item('0xOwned1'), item('0xOwned2')], groups)

    expect(result.size).toBe(0)
  })

  it('lists every peer grouped by list and excludes the row itself (mixed cluster)', () => {
    // Cluster g1: two owned (o1, o2) + one trusted (t1) → all three warn, spanning both lists.
    const groups = new Map([
      ['0xt1', 'g1'],
      ['0xo1', 'g1'],
      ['0xo2', 'g1'],
    ])
    const result = buildSimilarWarnings([item('0xT1')], [item('0xO1'), item('0xO2')], groups)

    expect(result.get('0xo1')).toEqual({ trusted: [peer('0xt1')], owned: [peer('0xo2')] })
    expect(result.get('0xt1')).toEqual({ trusted: [], owned: [peer('0xo1'), peer('0xo2')] })
  })

  it('gives each peer every chain it is listed on', () => {
    const groups = new Map([
      ['0xtrusted', 'g1'],
      ['0xowned', 'g1'],
    ])
    const result = buildSimilarWarnings(
      [item('0xTrusted', '1'), item('0xTrusted', '137')],
      [item('0xOwned', '10')],
      groups,
    )

    expect(result.get('0xowned')).toEqual({ trusted: [peer('0xtrusted', ['1', '137'])], owned: [] })
    expect(result.get('0xtrusted')).toEqual({ trusted: [], owned: [peer('0xowned', ['10'])] })
  })
})
