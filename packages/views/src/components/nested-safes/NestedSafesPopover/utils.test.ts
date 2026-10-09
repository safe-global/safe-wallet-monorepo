import { faker } from '@faker-js/faker'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import {
  getIsFirstTimeCuration,
  getIsManageMode,
  getPopoverWidth,
  getSelectedCountLabel,
  getSafesToShow,
  getUncuratedCount,
  getUncuratedCountLabel,
} from './utils'

function makeNestedSafe(overrides?: Partial<NestedSafeWithStatus>): NestedSafeWithStatus {
  return {
    address: faker.finance.ethereumAddress(),
    isValid: true,
    isCurated: true,
    ...overrides,
  }
}

describe('getSelectedCountLabel', () => {
  it('uses singular "safe" for exactly one selected', () => {
    expect(getSelectedCountLabel(1)).toBe('1 safe selected')
  })

  it('uses plural "safes" for zero selected', () => {
    expect(getSelectedCountLabel(0)).toBe('0 safes selected')
  })

  it('uses plural "safes" for multiple selected', () => {
    expect(getSelectedCountLabel(5)).toBe('5 safes selected')
  })
})

describe('getUncuratedCountLabel', () => {
  it('uses singular "safe" for exactly one uncurated', () => {
    expect(getUncuratedCountLabel(1)).toBe('+1 more nested safe found')
  })

  it('uses plural "safes" for multiple uncurated', () => {
    expect(getUncuratedCountLabel(3)).toBe('+3 more nested safes found')
  })

  it('uses plural "safes" for zero (edge case)', () => {
    expect(getUncuratedCountLabel(0)).toBe('+0 more nested safes found')
  })
})

describe('getPopoverWidth', () => {
  it('returns wide width when manage mode is active', () => {
    expect(getPopoverWidth(true)).toBe('min(750px, calc(100vw - 32px))')
  })

  it('returns narrow width when manage mode is inactive', () => {
    expect(getPopoverWidth(false)).toBe('min(420px, calc(100vw - 32px))')
  })
})

describe('getSafesToShow', () => {
  const allSafes = [makeNestedSafe(), makeNestedSafe(), makeNestedSafe()]
  const visibleSafes = [allSafes[0]]

  it('returns allSafesWithStatus in manage mode', () => {
    expect(getSafesToShow(true, allSafes, visibleSafes)).toBe(allSafes)
  })

  it('returns visibleSafes in normal mode', () => {
    expect(getSafesToShow(false, allSafes, visibleSafes)).toBe(visibleSafes)
  })

  it('returns empty visibleSafes when no visible safes in normal mode', () => {
    expect(getSafesToShow(false, allSafes, [])).toEqual([])
  })
})

describe('getUncuratedCount', () => {
  it('returns the difference between raw safes and visible safes', () => {
    const rawAddresses = [
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
    ]
    const visible = [makeNestedSafe()]
    expect(getUncuratedCount(rawAddresses, visible)).toBe(2)
  })

  it('returns zero when all safes are visible', () => {
    const rawAddresses = [faker.finance.ethereumAddress()]
    const visible = [makeNestedSafe()]
    expect(getUncuratedCount(rawAddresses, visible)).toBe(0)
  })

  it('returns full count when no safes are visible', () => {
    const rawAddresses = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
    expect(getUncuratedCount(rawAddresses, [])).toBe(2)
  })

  it('returns zero for empty inputs', () => {
    expect(getUncuratedCount([], [])).toBe(0)
  })
})

describe('getIsFirstTimeCuration', () => {
  it('returns true when curation has not been completed and raw safes exist', () => {
    expect(getIsFirstTimeCuration(false, [faker.finance.ethereumAddress()])).toBe(true)
  })

  it('returns false when curation has been completed', () => {
    expect(getIsFirstTimeCuration(true, [faker.finance.ethereumAddress()])).toBe(false)
  })

  it('returns false when there are no raw safes even if curation not completed', () => {
    expect(getIsFirstTimeCuration(false, [])).toBe(false)
  })

  it('returns false when both curation is complete and no safes exist', () => {
    expect(getIsFirstTimeCuration(true, [])).toBe(false)
  })
})

describe('getIsManageMode', () => {
  it('returns true when user explicitly requested manage mode', () => {
    expect(getIsManageMode(true, false, true)).toBe(true)
    expect(getIsManageMode(true, false, false)).toBe(true)
    expect(getIsManageMode(true, true, false)).toBe(true)
  })

  it('returns true for first-time curation when intro has been dismissed', () => {
    expect(getIsManageMode(false, true, false)).toBe(true)
  })

  it('returns false for first-time curation when intro is still showing', () => {
    expect(getIsManageMode(false, true, true)).toBe(false)
  })

  it('returns false in normal mode when not first-time curation', () => {
    expect(getIsManageMode(false, false, true)).toBe(false)
    expect(getIsManageMode(false, false, false)).toBe(false)
  })
})
