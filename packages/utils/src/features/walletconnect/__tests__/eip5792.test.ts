import { ATOMIC_CAPABILITY, buildAtomicCapabilities } from '../eip5792'

describe('buildAtomicCapabilities', () => {
  it('keys the capability map by hex chain id', () => {
    expect(buildAtomicCapabilities(['0x1', '0x89'])).toEqual({
      '0x1': ATOMIC_CAPABILITY,
      '0x89': ATOMIC_CAPABILITY,
    })
  })

  it('advertises both the current and legacy atomic shapes', () => {
    expect(ATOMIC_CAPABILITY).toEqual({
      atomic: { status: 'supported' },
      atomicBatch: { supported: true },
    })
  })

  it('returns an empty map for no chains', () => {
    expect(buildAtomicCapabilities([])).toEqual({})
  })
})
