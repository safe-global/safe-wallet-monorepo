import 'fake-indexeddb/auto'
import { set, setMany } from 'idb-keyval'
import { renderHook, waitFor } from '@/tests/test-utils'
import { toBeHex } from 'ethers'

import {
  createPushNotificationUuidIndexedDb,
  createPushNotificationPrefsIndexedDb,
} from '@/services/push-notifications/preferences'
import {
  useNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  _setPreferences,
  _setUuid,
} from '../useNotificationPreferences'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(),
  },
})

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    // Reset indexedDB
    indexedDB = new IDBFactory()
  })

  describe('uuidStore', () => {
    beforeEach(() => {
      _setUuid(undefined)
    })

    it('should initialise uuid if it does not exist', async () => {
      const { result } = renderHook(() => useNotificationPreferences())

      await waitFor(() => {
        expect(result.current.uuid).toEqual(expect.any(String))
      })
    })

    it('return uuid if it exists', async () => {
      const uuid = 'test-uuid'

      await set('uuid', uuid, createPushNotificationUuidIndexedDb())

      const { result } = renderHook(() => useNotificationPreferences())

      await waitFor(() => {
        expect(result.current.uuid).toEqual(uuid)
      })
    })
  })

  describe('preferencesStore', () => {
    beforeEach(() => {
      _setPreferences(undefined)
    })

    describe('_getAllPreferenceEntries', () => {
      it('should get all preference entries', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        const preferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(async () => {
          const _preferences = await result.current._getAllPreferenceEntries()
          expect(_preferences).toEqual(Object.entries(preferences))
        })
      })
    })

    describe('_deleteManyPreferenceKeys', () => {
      it('should delete many preference keys', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        const preferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual(preferences)
        })

        const keysToDelete = Object.entries(preferences).map(([key]) => key)

        result.current._deleteManyPreferenceKeys(keysToDelete as `${string}:${string}`[])

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({})
        })
      })
    })

    describe('getAllPreferences', () => {
      it('should return all existing preferences', async () => {
        const chainId = '1'
        const safeAddress = toBeHex('0x1', 20)

        const preferences = {
          [`${chainId}:${safeAddress}`]: {
            chainId,
            safeAddress,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual(preferences)
        })
      })
    })

    describe('getPreferences', () => {
      it('should return existing Safe preferences', async () => {
        const chainId = '1'
        const safeAddress = toBeHex('0x1', 20)

        const preferences = {
          [`${chainId}:${safeAddress}`]: {
            chainId,
            safeAddress,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getPreferences(chainId, safeAddress)).toEqual(
            preferences[`${chainId}:${safeAddress}`].preferences,
          )
        })
      })
    })

    describe('getChainPreferences', () => {
      const chainId1 = '1'
      const safeAddress1 = toBeHex('0x1', 20)
      const safeAddress2 = toBeHex('0x2', 20)

      const chainId2 = '2'

      const preferences = {
        [`${chainId1}:${safeAddress1}`]: {
          chainId: chainId1,
          safeAddress: safeAddress1,
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
        [`${chainId1}:${safeAddress2}`]: {
          chainId: chainId1,
          safeAddress: safeAddress2,
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
        [`${chainId2}:${safeAddress1}`]: {
          chainId: chainId2,
          safeAddress: safeAddress1,
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
      }

      it('should return existing chain preferences', async () => {
        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getChainPreferences(chainId1)).toEqual([
            {
              chainId: chainId1,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
            {
              chainId: chainId1,
              safeAddress: safeAddress2,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
          ])
        })
      })

      it('should return an empty array if no preferences exist for the chain', async () => {
        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getChainPreferences('3')).toEqual([])
        })
      })

      it('should return an empty array if no preferences exist', async () => {
        const { result } = renderHook(() => useNotificationPreferences())

        await waitFor(() => {
          expect(result.current.getChainPreferences('1')).toEqual([])
        })
      })
    })

    describe('createPreferences', () => {
      it('should create preferences, then hydrate the preferences state', async () => {
        const { result } = renderHook(() => useNotificationPreferences())

        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        result.current.createPreferences({
          [chainId1]: [safeAddress1, safeAddress2],
          [chainId2]: [safeAddress1],
        })

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({
            [`${chainId1}:${safeAddress1}`]: {
              chainId: chainId1,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
            [`${chainId1}:${safeAddress2}`]: {
              chainId: chainId1,
              safeAddress: safeAddress2,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
            [`${chainId2}:${safeAddress1}`]: {
              chainId: chainId2,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
          })
        })
      })

      it('should not create preferences when passed an empty object', async () => {
        const { result } = renderHook(() => useNotificationPreferences())

        result.current.createPreferences({})

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({})
        })
      })

      it('should not create preferences when passed an empty array of Safes', async () => {
        const { result } = renderHook(() => useNotificationPreferences())

        result.current.createPreferences({ ['1']: [] })

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({})
        })
      })

      it('should hydrate across instances', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'
        const { result: instance1 } = renderHook(() => useNotificationPreferences())
        const { result: instance2 } = renderHook(() => useNotificationPreferences())

        instance1.current.createPreferences({
          [chainId1]: [safeAddress1, safeAddress2],
          [chainId2]: [safeAddress1],
        })

        const expectedPreferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await waitFor(() => {
          expect(instance1.current.getAllPreferences()).toEqual(expectedPreferences)
          expect(instance2.current.getAllPreferences()).toEqual(expectedPreferences)
        })
      })
    })

    describe('updatePreferences', () => {
      it('should update preferences, then hydrate the preferences state', async () => {
        const chainId = '1'
        const safeAddress = toBeHex('0x1', 20)

        const preferences = {
          [`${chainId}:${safeAddress}`]: {
            chainId,
            safeAddress,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        result.current.updatePreferences(chainId, safeAddress, {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          [WebhookType.CONFIRMATION_REQUEST]: false,
        })

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({
            [`${chainId}:${safeAddress}`]: {
              chainId,
              safeAddress,
              preferences: {
                ...DEFAULT_NOTIFICATION_PREFERENCES,
                [WebhookType.CONFIRMATION_REQUEST]: false,
              },
            },
          })
        })
      })
    })

    describe('deletePreferences', () => {
      it('should delete preferences, then hydrate the preferences state', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        const preferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        result.current.deletePreferences({
          [chainId1]: [safeAddress1, safeAddress2],
        })

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({
            [`${chainId2}:${safeAddress1}`]: {
              chainId: chainId2,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
          })
        })
      })

      it('should delete preferences, then hydrate the preferences state', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        const preferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        result.current.deletePreferences({
          [chainId1]: [safeAddress1, safeAddress2],
        })

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({
            [`${chainId2}:${safeAddress1}`]: {
              chainId: chainId2,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
          })
        })
      })
    })

    describe('deleteAllChainPreferences', () => {
      it('should delete per chain, then hydrate the preferences state', async () => {
        const chainId1 = '1'
        const safeAddress1 = toBeHex('0x1', 20)
        const safeAddress2 = toBeHex('0x1', 20)

        const chainId2 = '2'

        const preferences = {
          [`${chainId1}:${safeAddress1}`]: {
            chainId: chainId1,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId1}:${safeAddress2}`]: {
            chainId: chainId1,
            safeAddress: safeAddress2,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
          [`${chainId2}:${safeAddress1}`]: {
            chainId: chainId2,
            safeAddress: safeAddress1,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          },
        }

        await setMany(Object.entries(preferences), createPushNotificationPrefsIndexedDb())

        const { result } = renderHook(() => useNotificationPreferences())

        result.current.deleteAllChainPreferences(chainId1)

        await waitFor(() => {
          expect(result.current.getAllPreferences()).toEqual({
            [`${chainId2}:${safeAddress1}`]: {
              chainId: chainId2,
              safeAddress: safeAddress1,
              preferences: DEFAULT_NOTIFICATION_PREFERENCES,
            },
          })
        })
      })
    })
  })
})
