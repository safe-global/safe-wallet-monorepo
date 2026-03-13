import { faker } from '@faker-js/faker'
import {
  _areAllSafesSelected,
  _filterUndeployedSafes,
  _getSafesToRegister,
  _getSafesToUnregister,
  _getTotalNotifiableSafes,
  _getTotalSignaturesRequired,
  _mergeNotifiableSafes,
  _sanitizeNotifiableSafes,
  _shouldRegisterSelectedSafes,
  _shouldUnregisterDevice,
  _shouldUnregsiterSelectedSafes,
  _transformAddedSafes,
  _transformCurrentSubscribedSafes,
} from './GlobalPushNotifications.utils'
import { chainBuilder } from '@/tests/builders/chains'
import type { NotifiableSafes } from './logic'
import type { PushNotificationPreferences } from '@/services/push-notifications/preferences'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'

const addr = () => faker.finance.ethereumAddress()

describe('_filterUndeployedSafes', () => {
  it('removes undeployed safe addresses from matching chains', () => {
    const deployedAddr = addr()
    const undeployedAddr = addr()
    const chainId = '1'

    const safes: NotifiableSafes = { [chainId]: [deployedAddr, undeployedAddr] }
    const undeployedSafes = { [chainId]: { [undeployedAddr]: {} } } as unknown as UndeployedSafesState

    const result = _filterUndeployedSafes(safes, undeployedSafes)
    expect(result[chainId]).toEqual([deployedAddr])
  })

  it('removes a chain entirely when all its safes are undeployed', () => {
    const undeployedAddr = addr()
    const chainId = '1'

    const safes: NotifiableSafes = { [chainId]: [undeployedAddr] }
    const undeployedSafes = { [chainId]: { [undeployedAddr]: {} } } as unknown as UndeployedSafesState

    const result = _filterUndeployedSafes(safes, undeployedSafes)
    expect(result).not.toHaveProperty(chainId)
  })

  it('keeps chains with no undeployed safes intact', () => {
    const safeAddr = addr()
    const chainId = '137'

    const safes: NotifiableSafes = { [chainId]: [safeAddr] }
    const undeployedSafes: UndeployedSafesState = {}

    const result = _filterUndeployedSafes(safes, undeployedSafes)
    expect(result[chainId]).toEqual([safeAddr])
  })

  it('returns empty object when safes is undefined', () => {
    const result = _filterUndeployedSafes(undefined, {})
    expect(result).toEqual({})
  })
})

describe('_transformAddedSafes', () => {
  it('converts added safes state to NotifiableSafes format', () => {
    const chainId = '1'
    const safeAddr = addr()
    const addedSafes: AddedSafesState = {
      [chainId]: { [safeAddr]: { owners: [], threshold: 1 } },
    }

    const result = _transformAddedSafes(addedSafes)
    expect(result[chainId]).toEqual([safeAddr])
  })

  it('handles multiple chains', () => {
    const addedSafes: AddedSafesState = {
      '1': { [addr()]: { owners: [], threshold: 1 }, [addr()]: { owners: [], threshold: 2 } },
      '137': { [addr()]: { owners: [], threshold: 1 } },
    }

    const result = _transformAddedSafes(addedSafes)
    expect(result['1']).toHaveLength(2)
    expect(result['137']).toHaveLength(1)
  })

  it('returns empty object for empty state', () => {
    expect(_transformAddedSafes({})).toEqual({})
  })
})

describe('_transformCurrentSubscribedSafes', () => {
  it('returns undefined when allPreferences is undefined', () => {
    expect(_transformCurrentSubscribedSafes(undefined)).toBeUndefined()
  })

  it('converts preferences to NotifiableSafes grouped by chainId', () => {
    const chainId = '1'
    const safeAddress = addr()
    const preferences: PushNotificationPreferences = {
      [`${chainId}:${safeAddress}`]: { chainId, safeAddress, preferences: {} as never },
    }

    const result = _transformCurrentSubscribedSafes(preferences)
    expect(result).toEqual({ [chainId]: [safeAddress] })
  })

  it('groups multiple safes on the same chain', () => {
    const chainId = '1'
    const addr1 = addr()
    const addr2 = addr()
    const preferences: PushNotificationPreferences = {
      [`${chainId}:${addr1}`]: { chainId, safeAddress: addr1, preferences: {} as never },
      [`${chainId}:${addr2}`]: { chainId, safeAddress: addr2, preferences: {} as never },
    }

    const result = _transformCurrentSubscribedSafes(preferences)
    expect(result?.[chainId]).toHaveLength(2)
    expect(result?.[chainId]).toContain(addr1)
    expect(result?.[chainId]).toContain(addr2)
  })

  it('handles safes across multiple chains', () => {
    const addr1 = addr()
    const addr2 = addr()
    const preferences: PushNotificationPreferences = {
      [`1:${addr1}`]: { chainId: '1', safeAddress: addr1, preferences: {} as never },
      [`137:${addr2}`]: { chainId: '137', safeAddress: addr2, preferences: {} as never },
    }

    const result = _transformCurrentSubscribedSafes(preferences)
    expect(result?.['1']).toEqual([addr1])
    expect(result?.['137']).toEqual([addr2])
  })
})

describe('_sanitizeNotifiableSafes', () => {
  it('keeps safes that are on a supported chain', () => {
    const chainId = '1'
    const safeAddr = addr()
    const chain = chainBuilder().with({ chainId }).build()

    const result = _sanitizeNotifiableSafes([chain], { [chainId]: [safeAddr] })
    expect(result[chainId]).toEqual([safeAddr])
  })

  it('removes safes on unsupported chains', () => {
    const safeAddr = addr()
    const chain = chainBuilder().with({ chainId: '1' }).build()

    const result = _sanitizeNotifiableSafes([chain], { '999': [safeAddr] })
    expect(result).not.toHaveProperty('999')
  })

  it('returns empty object when no chains match', () => {
    const result = _sanitizeNotifiableSafes([], { '1': [addr()] })
    expect(result).toEqual({})
  })
})

describe('_mergeNotifiableSafes', () => {
  it('merges owned, added, and subscribed safes without duplicates', () => {
    const chainId = '1'
    const safeAddr = addr()

    const ownedSafes = { [chainId]: [safeAddr] }
    const addedSafes: AddedSafesState = { [chainId]: { [safeAddr]: { owners: [], threshold: 1 } } }
    const currentSubscriptions: NotifiableSafes = { [chainId]: [safeAddr] }

    const result = _mergeNotifiableSafes(ownedSafes, addedSafes, currentSubscriptions)
    expect(result?.[chainId]).toEqual([safeAddr])
  })

  it('orders: subscribed first, then added&owned, then owned-only', () => {
    const chainId = '1'
    const subscribedAddr = addr()
    const ownedAddr = addr()

    const ownedSafes = { [chainId]: [subscribedAddr, ownedAddr] }
    const addedSafes: AddedSafesState = {}
    const currentSubscriptions: NotifiableSafes = { [chainId]: [subscribedAddr] }

    const result = _mergeNotifiableSafes(ownedSafes, addedSafes, currentSubscriptions)
    expect(result?.[chainId][0]).toBe(subscribedAddr)
    expect(result?.[chainId][1]).toBe(ownedAddr)
  })

  it('excludes added safes that are not in owned safes', () => {
    const chainId = '1'
    const ownedAddr = addr()
    const addedNotOwnedAddr = addr()

    const ownedSafes = { [chainId]: [ownedAddr] }
    const addedSafes: AddedSafesState = {
      [chainId]: {
        [ownedAddr]: { owners: [], threshold: 1 },
        [addedNotOwnedAddr]: { owners: [], threshold: 1 },
      },
    }

    const result = _mergeNotifiableSafes(ownedSafes, addedSafes, undefined)
    expect(result?.[chainId]).not.toContain(addedNotOwnedAddr)
    expect(result?.[chainId]).toContain(ownedAddr)
  })

  it('handles undefined ownedSafes', () => {
    const chainId = '1'
    const safeAddr = addr()
    const addedSafes: AddedSafesState = { [chainId]: { [safeAddr]: { owners: [], threshold: 1 } } }

    const result = _mergeNotifiableSafes(undefined, addedSafes, undefined)
    // added safes not in owned safes are excluded
    expect(result?.[chainId]).toEqual([])
  })

  it('merges chains from all sources', () => {
    const ownedSafes = { '1': [addr()] }
    const addedSafes: AddedSafesState = { '137': { [addr()]: { owners: [], threshold: 1 } } }
    const currentSubscriptions: NotifiableSafes = { '10': [addr()] }

    const result = _mergeNotifiableSafes(ownedSafes, addedSafes, currentSubscriptions)
    expect(result).toHaveProperty('1')
    expect(result).toHaveProperty('137')
    expect(result).toHaveProperty('10')
  })
})

describe('_getTotalNotifiableSafes', () => {
  it('sums all safe addresses across chains', () => {
    const notifiableSafes: NotifiableSafes = {
      '1': [addr(), addr()],
      '137': [addr()],
    }
    expect(_getTotalNotifiableSafes(notifiableSafes)).toBe(3)
  })

  it('returns 0 for empty object', () => {
    expect(_getTotalNotifiableSafes({})).toBe(0)
  })

  it('returns 0 when chains have empty arrays', () => {
    expect(_getTotalNotifiableSafes({ '1': [], '137': [] })).toBe(0)
  })
})

describe('_areAllSafesSelected', () => {
  it('returns false when notifiableSafes is empty', () => {
    expect(_areAllSafesSelected({}, {})).toBe(false)
  })

  it('returns true when all safes on all chains are selected', () => {
    const chainId = '1'
    const safeAddr = addr()
    const notifiable: NotifiableSafes = { [chainId]: [safeAddr] }
    const selected: NotifiableSafes = { [chainId]: [safeAddr] }

    expect(_areAllSafesSelected(notifiable, selected)).toBe(true)
  })

  it('returns false when a chain is missing from selected', () => {
    const notifiable: NotifiableSafes = { '1': [addr()] }
    const selected: NotifiableSafes = {}

    expect(_areAllSafesSelected(notifiable, selected)).toBe(false)
  })

  it('returns false when a safe on a chain is not selected', () => {
    const chainId = '1'
    const addr1 = addr()
    const addr2 = addr()
    const notifiable: NotifiableSafes = { [chainId]: [addr1, addr2] }
    const selected: NotifiableSafes = { [chainId]: [addr1] }

    expect(_areAllSafesSelected(notifiable, selected)).toBe(false)
  })
})

describe('_getTotalSignaturesRequired', () => {
  it('returns 1 per new chain that has newly selected safes', () => {
    const selected: NotifiableSafes = { '1': [addr()], '137': [addr()] }
    expect(_getTotalSignaturesRequired(selected, undefined)).toBe(2)
  })

  it('returns 0 when no new safes are being added', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_getTotalSignaturesRequired(selected, current)).toBe(0)
  })

  it('returns 1 when a new safe is added to an existing chain', () => {
    const existing = addr()
    const newAddr = addr()
    const selected: NotifiableSafes = { '1': [existing, newAddr] }
    const current: NotifiableSafes = { '1': [existing] }

    expect(_getTotalSignaturesRequired(selected, current)).toBe(1)
  })

  it('skips chains with empty safe arrays', () => {
    const selected: NotifiableSafes = { '1': [], '137': [addr()] }
    expect(_getTotalSignaturesRequired(selected, undefined)).toBe(1)
  })
})

describe('_shouldRegisterSelectedSafes', () => {
  it('returns true when a selected safe is not in current notified safes', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }

    expect(_shouldRegisterSelectedSafes(selected, undefined)).toBe(true)
  })

  it('returns false when all selected safes are already notified', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_shouldRegisterSelectedSafes(selected, current)).toBe(false)
  })

  it('returns true when a selected safe is new on an existing chain', () => {
    const existing = addr()
    const newAddr = addr()
    const selected: NotifiableSafes = { '1': [existing, newAddr] }
    const current: NotifiableSafes = { '1': [existing] }

    expect(_shouldRegisterSelectedSafes(selected, current)).toBe(true)
  })
})

describe('_shouldUnregsiterSelectedSafes', () => {
  it('returns true when a currently notified safe is not in selected', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = {}
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_shouldUnregsiterSelectedSafes(selected, current)).toBe(true)
  })

  it('returns false when all current safes are still selected', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_shouldUnregsiterSelectedSafes(selected, current)).toBe(false)
  })

  it('returns false when currentNotifiedSafes is undefined', () => {
    expect(_shouldUnregsiterSelectedSafes({}, undefined)).toBe(false)
  })
})

describe('_getSafesToRegister', () => {
  it('returns safes not yet in currentNotifiedSafes', () => {
    const newAddr = addr()
    const selected: NotifiableSafes = { '1': [newAddr] }

    const result = _getSafesToRegister(selected, undefined)
    expect(result?.['1']).toEqual([newAddr])
  })

  it('excludes safes already in currentNotifiedSafes', () => {
    const existing = addr()
    const newAddr = addr()
    const selected: NotifiableSafes = { '1': [existing, newAddr] }
    const current: NotifiableSafes = { '1': [existing] }

    const result = _getSafesToRegister(selected, current)
    expect(result?.['1']).toEqual([newAddr])
  })

  it('returns undefined when no new safes to register', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_getSafesToRegister(selected, current)).toBeUndefined()
  })

  it('handles multiple chains', () => {
    const addr1 = addr()
    const addr2 = addr()
    const selected: NotifiableSafes = { '1': [addr1], '137': [addr2] }

    const result = _getSafesToRegister(selected, undefined)
    expect(result?.['1']).toEqual([addr1])
    expect(result?.['137']).toEqual([addr2])
  })
})

describe('_getSafesToUnregister', () => {
  it('returns undefined when currentNotifiedSafes is undefined', () => {
    expect(_getSafesToUnregister({}, undefined)).toBeUndefined()
  })

  it('returns safes in current but not in selected', () => {
    const removedAddr = addr()
    const selected: NotifiableSafes = {}
    const current: NotifiableSafes = { '1': [removedAddr] }

    const result = _getSafesToUnregister(selected, current)
    expect(result?.['1']).toEqual([removedAddr])
  })

  it('excludes safes still in selected', () => {
    const keepAddr = addr()
    const removeAddr = addr()
    const selected: NotifiableSafes = { '1': [keepAddr] }
    const current: NotifiableSafes = { '1': [keepAddr, removeAddr] }

    const result = _getSafesToUnregister(selected, current)
    expect(result?.['1']).toEqual([removeAddr])
  })

  it('returns undefined when all current safes remain selected', () => {
    const safeAddr = addr()
    const selected: NotifiableSafes = { '1': [safeAddr] }
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_getSafesToUnregister(selected, current)).toBeUndefined()
  })
})

describe('_shouldUnregisterDevice', () => {
  it('returns false when currentNotifiedSafes is undefined', () => {
    expect(_shouldUnregisterDevice('1', [addr()], undefined)).toBe(false)
  })

  it('returns false when safe counts differ', () => {
    const addr1 = addr()
    const addr2 = addr()
    const current: NotifiableSafes = { '1': [addr1, addr2] }

    expect(_shouldUnregisterDevice('1', [addr1], current)).toBe(false)
  })

  it('returns true when safeAddresses exactly matches currentNotifiedSafes for the chain', () => {
    const safeAddr = addr()
    const current: NotifiableSafes = { '1': [safeAddr] }

    expect(_shouldUnregisterDevice('1', [safeAddr], current)).toBe(true)
  })

  it('returns false when an address in safeAddresses is not in currentNotifiedSafes', () => {
    const knownAddr = addr()
    const unknownAddr = addr()
    const current: NotifiableSafes = { '1': [knownAddr, unknownAddr] }

    expect(_shouldUnregisterDevice('1', [knownAddr, addr()], current)).toBe(false)
  })
})
