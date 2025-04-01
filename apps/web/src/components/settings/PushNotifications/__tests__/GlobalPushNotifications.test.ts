import type { AllOwnedSafes, ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

import {
  _mergeNotifiableSafes,
  _transformCurrentSubscribedSafes,
  _getTotalNotifiableSafes,
  _areAllSafesSelected,
  _getTotalSignaturesRequired,
  _shouldRegisterSelectedSafes,
  _shouldUnregsiterSelectedSafes,
  _getSafesToRegister,
  _getSafesToUnregister,
  _shouldUnregisterDevice,
  _sanitizeNotifiableSafes,
  _filterUndeployedSafes,
  _transformAddedSafes,
} from '../GlobalPushNotifications'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'

describe('GlobalPushNotifications', () => {
  describe('transformAddedSafes', () => {
    it('should transform added safes into notifiable safes', () => {
      const addedSafes = {
        '1': {
          '0x123': {},
          '0x456': {},
        },
        '4': {
          '0x789': {},
        },
      } as unknown as AddedSafesState

      const expectedNotifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      expect(_transformAddedSafes(addedSafes)).toEqual(expectedNotifiableSafes)
    })
  })

  describe('mergeNotifiableSafes', () => {
    it('should merge added safes and current subscriptions, removing unowned safes', () => {
      const currentSubscriptions = {
        '1': ['0x111', '0x222'],
        '4': ['0x111'],
      }

      const addedSafes = {
        '1': {
          '0x111': {},
          '0x333': {},
        },
        '4': {
          '0x222': {},
          '0x333': {},
        },
      } as unknown as AddedSafesState

      const ownedSafes = {
        '1': ['0x111', '0x444'],
        '4': ['0x222'],
      } as unknown as AllOwnedSafes

      const expectedNotifiableSafes = {
        '1': ['0x111', '0x222', '0x444'],
        '4': ['0x111', '0x222'],
      }

      expect(_mergeNotifiableSafes(ownedSafes, addedSafes, currentSubscriptions)).toEqual(expectedNotifiableSafes)
    })

    it('should remove unowned safes and display added safes first', () => {
      const addedSafes = {
        '1': {
          '0x222': {},
        },
        '4': {
          '0x222': {},
          '0x333': {},
        },
      } as unknown as AddedSafesState

      const ownedSafes = {
        '1': ['0x111', '0x222', '0x333', '0x444'],
        '4': ['0x222'],
      } as unknown as AllOwnedSafes

      const expectedNotifiableSafes = {
        '1': ['0x222', '0x111', '0x333', '0x444'],
        '4': ['0x222'],
      }

      expect(_mergeNotifiableSafes(ownedSafes, addedSafes)).toEqual(expectedNotifiableSafes)
    })
  })

  describe('filterUndeployedSafes', () => {
    it('should remove Safes that are not deployed', () => {
      const notifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0xabc'],
      }

      const undeployedSafes = {
        '1': {
          '0x456': {
            props: {
              safeAccountConfig: {},
              safeDeploymentConfig: {},
            },
            status: {},
          } as UndeployedSafe,
        },
      }

      const expected = {
        '1': ['0x123'],
        '4': ['0xabc'],
      }

      expect(_filterUndeployedSafes(notifiableSafes, undeployedSafes)).toEqual(expected)
    })
  })

  describe('sanitizeNotifiableSafes', () => {
    it('should remove Safes that are not on a supported chain', () => {
      const chains = [{ chainId: '1', name: 'Mainnet' }] as unknown as Array<ChainInfo>

      const notifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0xabc'],
      }

      const expected = {
        '1': ['0x123', '0x456'],
      }

      expect(_sanitizeNotifiableSafes(chains, notifiableSafes)).toEqual(expected)
    })
  })

  describe('transformCurrentSubscribedSafes', () => {
    it('should transform current subscriptions into notifiable safes', () => {
      const currentSubscriptions = {
        '0x123': {
          chainId: '1',
          safeAddress: '0x123',
        },
        '0x456': {
          chainId: '1',
          safeAddress: '0x456',
        },
        '0x789': {
          chainId: '4',
          safeAddress: '0x789',
        },
      }

      const expectedNotifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      expect(_transformCurrentSubscribedSafes(currentSubscriptions)).toEqual(expectedNotifiableSafes)
    })

    it('should return undefined if there are no current subscriptions', () => {
      expect(_transformCurrentSubscribedSafes()).toBeUndefined()
    })
  })

  describe('getTotalNotifiableSafes', () => {
    it('should return the total number of notifiable safes', () => {
      const notifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      expect(_getTotalNotifiableSafes(notifiableSafes)).toEqual(3)
    })

    it('should return 0 if there are no notifiable safes', () => {
      expect(_getTotalNotifiableSafes({})).toEqual(0)
    })
  })

  describe('areAllSafesSelected', () => {
    it('should return true if all notifiable safes are selected', () => {
      const notifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      expect(_areAllSafesSelected(notifiableSafes, selectedSafes)).toEqual(true)
    })

    it('should return false if not all notifiable safes are selected', () => {
      const notifiableSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x123'],
      }

      expect(_areAllSafesSelected(notifiableSafes, selectedSafes)).toEqual(false)
    })

    it('should return false if there are no notifiable safes', () => {
      const notifiableSafes = {}

      const selectedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      expect(_areAllSafesSelected(notifiableSafes, selectedSafes)).toEqual(false)
    })
  })

  describe('getTotalSignaturesRequired', () => {
    it('should return the total number of signatures required to register a new chain', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        ...currentNotifiedSafes,
        '5': ['0xabc'],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(1)
    })

    it('should return the total number of signatures required to register a new Safe', () => {
      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123'],
        '4': [...currentNotifiedSafes['4'], '0xabc'],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(1)
    })

    it('should return the total number of signatures required to register new chains/Safes', () => {
      const currentNotifiedSafes = {}

      const selectedSafes = {
        '1': ['0x123'],
        '4': ['0x789', '0xabc'],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(2)
    })

    it('should not increase the count if a new chain is empty', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
      }

      const selectedSafes = {
        '1': currentNotifiedSafes['1'],
        '5': [],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(0)
    })

    it('should not increase the count if a chain was removed', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': currentNotifiedSafes['1'],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(0)
    })

    it('should not increase the count if a Safe was removed', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': currentNotifiedSafes['1'].slice(0, 1),
        '4': ['0x789'],
      }

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(0)
    })

    it('should not increase the count if a chain/Safe was removed', () => {
      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789', '0xabc'],
      }

      const selectedSafes = {}

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(0)
    })

    it('should return 0 if there are no selected safes', () => {
      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const selectedSafes = {}

      expect(_getTotalSignaturesRequired(selectedSafes, currentNotifiedSafes)).toEqual(0)
    })
  })

  describe('shouldRegisterSelectedSafes', () => {
    it('should return true if there are safes to register', () => {
      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const result = _shouldRegisterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return true if there are chains to register', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const result = _shouldRegisterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return true if there are safes/chains to register', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456', '0x789'],
        '4': ['0x789'],
      }

      const result = _shouldRegisterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return false if there are no safes to register', () => {
      const selectedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const result = _shouldRegisterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(false)
    })
  })

  describe('shouldUnregisterSelectedSafes', () => {
    it('should return true if there are safes to unregister', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const result = _shouldUnregsiterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return true if there are chains to unregister', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789', '0xabc'],
      }

      const selectedSafes = {
        '1': ['0x123', '0x456'],
      }

      const result = _shouldUnregsiterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return true if there are safes/chains to unregister', () => {
      const currentNotifiedSafes = {
        '1': ['0x123', '0x456'],
        '4': ['0x789', '0xabc'],
      }

      const selectedSafes = {
        '1': ['0x123'],
      }

      const result = _shouldUnregsiterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('should return false if there are no safes to unregister', () => {
      const currentNotifiedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const selectedSafes = {
        '1': ['0x123'],
        '4': ['0x789'],
      }

      const result = _shouldUnregsiterSelectedSafes(selectedSafes, currentNotifiedSafes)
      expect(result).toBe(false)
    })
  })

  describe('getSafesToRegister', () => {
    it('returns the safes to register', () => {
      const currentNotifiedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }
      const selectedSafes = {
        1: ['0x123', '0x456'],
        4: ['0x789'],
      }

      const result = _getSafesToRegister(selectedSafes, currentNotifiedSafes)

      expect(result).toEqual({
        1: ['0x456'],
      })
    })

    it('returns undefined if there are no safes to register', () => {
      const currentNotifiedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }
      const selectedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }

      const result = _getSafesToRegister(selectedSafes, currentNotifiedSafes)

      expect(result).toBeUndefined()
    })
  })

  describe('getSafesToUnregister', () => {
    it('returns undefined if there are no current notified safes', () => {
      const currentNotifiedSafes = undefined
      const selectedSafes = {
        1: ['0x123', '0x456'],
        4: ['0x789'],
      }

      const result = _getSafesToUnregister(selectedSafes, currentNotifiedSafes)

      expect(result).toBeUndefined()
    })

    it('returns the safes to unregister', () => {
      const currentNotifiedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }
      const selectedSafes = {
        1: ['0x123', '0x456'],
        4: ['0x789'],
      }

      const result = _getSafesToUnregister(selectedSafes, currentNotifiedSafes)

      expect(result).toEqual({
        2: ['0xabc'],
        4: ['0xdef'],
      })
    })

    it('returns undefined if there are no safes to unregister', () => {
      const currentNotifiedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }
      const selectedSafes = {
        1: ['0x123'],
        2: ['0xabc'],
        4: ['0x789', '0xdef'],
      }

      const result = _getSafesToUnregister(selectedSafes, currentNotifiedSafes)

      expect(result).toBeUndefined()
    })
  })

  describe('shouldUnregisterDevice', () => {
    const chainId = '1'
    const safeAddresses = ['0x123', '0x456']
    const currentNotifiedSafes = {
      '1': ['0x123', '0x456'],
      '4': ['0x789'],
    }

    it('returns true if all safe addresses are included in currentNotifiedSafes', () => {
      const result = _shouldUnregisterDevice(chainId, safeAddresses, currentNotifiedSafes)
      expect(result).toBe(true)
    })

    it('returns false if not all safe addresses are included in currentNotifiedSafes', () => {
      const invalidSafeAddresses = ['0x123', '0x789']
      const result = _shouldUnregisterDevice(chainId, invalidSafeAddresses, currentNotifiedSafes)
      expect(result).toBe(false)
    })

    it('returns false if currentNotifiedSafes is undefined', () => {
      const result = _shouldUnregisterDevice(chainId, safeAddresses)
      expect(result).toBe(false)
    })

    it('returns false if the length of safeAddresses is different from the length of currentNotifiedSafes', () => {
      const invalidSafeAddresses = ['0x123']
      const result = _shouldUnregisterDevice(chainId, invalidSafeAddresses, currentNotifiedSafes)
      expect(result).toBe(false)
    })
  })
})
