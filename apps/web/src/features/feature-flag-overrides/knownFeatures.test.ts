import { FEATURES } from '@safe-global/utils/utils/chains'
import { isKnownFeature, SORTED_FEATURES } from './knownFeatures'

describe('knownFeatures', () => {
  it('knows every flag this build declares', () => {
    const unknown = Object.values(FEATURES).filter((feature) => !isKnownFeature(feature))

    expect(unknown).toEqual([])
  })

  it('does not know a flag from another branch', () => {
    expect(isKnownFeature('FLAG_FROM_ANOTHER_BRANCH')).toBe(false)
  })

  it('does not know an empty key', () => {
    expect(isKnownFeature('')).toBe(false)
  })

  it('does not mistake an inherited object property for a flag', () => {
    expect(isKnownFeature('toString')).toBe(false)
    expect(isKnownFeature('constructor')).toBe(false)
  })

  it('lists every flag exactly once, alphabetically', () => {
    expect(SORTED_FEATURES).toHaveLength(Object.values(FEATURES).length)
    expect(new Set(SORTED_FEATURES).size).toBe(SORTED_FEATURES.length)
    expect(SORTED_FEATURES).toEqual([...SORTED_FEATURES].sort((a, b) => a.localeCompare(b)))
  })
})
