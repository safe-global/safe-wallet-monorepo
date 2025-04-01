import {
  set as setIndexedDb,
  entries as getEntriesFromIndexedDb,
  delMany as deleteManyFromIndexedDb,
  setMany as setManyIndexedDb,
  update as updateIndexedDb,
} from 'idb-keyval'
import { useCallback, useEffect, useMemo } from 'react'

import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import {
  createPushNotificationPrefsIndexedDb,
  createPushNotificationUuidIndexedDb,
  getPushNotificationPrefsKey,
} from '@/services/push-notifications/preferences'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import type { PushNotificationPreferences, PushNotificationPrefsKey } from '@/services/push-notifications/preferences'
import type { NotifiableSafes } from '../logic'

export const DEFAULT_NOTIFICATION_PREFERENCES: PushNotificationPreferences[PushNotificationPrefsKey]['preferences'] = {
  [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: true,
  [WebhookType.INCOMING_ETHER]: true,
  [WebhookType.INCOMING_TOKEN]: true,
  [WebhookType.MODULE_TRANSACTION]: true,
  [WebhookType.CONFIRMATION_REQUEST]: true, // Requires signature
  [WebhookType.SAFE_CREATED]: false, // We do not preemptively subscribe to Safes before they are created
  // Disabled on the Transaction Service but kept here for completeness
  [WebhookType._PENDING_MULTISIG_TRANSACTION]: true,
  [WebhookType._NEW_CONFIRMATION]: true,
  [WebhookType._OUTGOING_ETHER]: true,
  [WebhookType._OUTGOING_TOKEN]: true,
}

// ExternalStores are used to keep indexedDB state synced across hook instances
const { useStore: useUuid, setStore: setUuid } = new ExternalStore<string>()
const { useStore: usePreferences, setStore: setPreferences } = new ExternalStore<PushNotificationPreferences>()

// Used for testing
export const _setUuid = setUuid
export const _setPreferences = setPreferences

export const useNotificationPreferences = (): {
  uuid: string | undefined
  getAllPreferences: () => PushNotificationPreferences | undefined
  getPreferences: (chainId: string, safeAddress: string) => typeof DEFAULT_NOTIFICATION_PREFERENCES | undefined
  updatePreferences: (
    chainId: string,
    safeAddress: string,
    preferences: PushNotificationPreferences[PushNotificationPrefsKey]['preferences'],
  ) => void
  createPreferences: (safesToRegister: NotifiableSafes) => void
  deletePreferences: (safesToUnregister: NotifiableSafes) => void
  deleteAllChainPreferences: (chainId: string) => void
  _getAllPreferenceEntries: () => Promise<
    [PushNotificationPrefsKey, PushNotificationPreferences[PushNotificationPrefsKey]][]
  >
  _deleteManyPreferenceKeys: (keysToDelete: PushNotificationPrefsKey[]) => void
  getChainPreferences: (chainId: string) => PushNotificationPreferences[PushNotificationPrefsKey][]
} => {
  // State
  const uuid = useUuid()
  const preferences = usePreferences()

  // Getters
  const getPreferences = (chainId: string, safeAddress: string) => {
    const key = getPushNotificationPrefsKey(chainId, safeAddress)
    return preferences?.[key]?.preferences
  }

  const getAllPreferences = useCallback(() => {
    return preferences
  }, [preferences])

  // Get list of preferences for specified chain
  const getChainPreferences = useCallback(
    (chainId: string) => {
      return Object.values(preferences || {}).filter((pref) => chainId === pref.chainId)
    },
    [preferences],
  )

  // idb-keyval stores
  const uuidStore = useMemo(() => {
    if (typeof indexedDB !== 'undefined') {
      return createPushNotificationUuidIndexedDb()
    }
  }, [])

  const preferencesStore = useMemo(() => {
    if (typeof indexedDB !== 'undefined') {
      return createPushNotificationPrefsIndexedDb()
    }
  }, [])

  // UUID state hydrator
  const hydrateUuidStore = useCallback(() => {
    if (!uuidStore) {
      return
    }

    const UUID_KEY = 'uuid'

    let _uuid: string

    updateIndexedDb<string>(
      UUID_KEY,
      (storedUuid) => {
        // Initialise UUID if it doesn't exist
        _uuid = storedUuid || self.crypto.randomUUID()
        return _uuid
      },
      uuidStore,
    )
      .then(() => {
        setUuid(_uuid)
      })
      .catch((e) => {
        logError(ErrorCodes._705, e)
      })
  }, [uuidStore])

  // Hydrate UUID state
  useEffect(() => {
    hydrateUuidStore()
  }, [hydrateUuidStore, uuidStore])

  const _getAllPreferenceEntries = useCallback(() => {
    return getEntriesFromIndexedDb<PushNotificationPrefsKey, PushNotificationPreferences[PushNotificationPrefsKey]>(
      preferencesStore,
    )
  }, [preferencesStore])

  // Preferences state hydrator
  const hydratePreferences = useCallback(() => {
    if (!preferencesStore) {
      return
    }

    _getAllPreferenceEntries()
      .then((preferencesEntries) => {
        setPreferences(Object.fromEntries(preferencesEntries))
      })
      .catch((e) => {
        logError(ErrorCodes._705, e)
      })
  }, [_getAllPreferenceEntries, preferencesStore])

  // Delete array of preferences store keys
  const _deleteManyPreferenceKeys = useCallback(
    (keysToDelete: PushNotificationPrefsKey[]) => {
      deleteManyFromIndexedDb(keysToDelete, preferencesStore)
        .then(hydratePreferences)
        .catch((e) => {
          logError(ErrorCodes._706, e)
        })
    },
    [hydratePreferences, preferencesStore],
  )

  // Hydrate preferences state
  useEffect(() => {
    hydratePreferences()
  }, [hydratePreferences])

  // Add store entry with default preferences for specified Safe(s)
  const createPreferences = (safesToRegister: NotifiableSafes) => {
    if (!preferencesStore) {
      return
    }

    const defaultPreferencesEntries = Object.entries(safesToRegister).flatMap(([chainId, safeAddresses]) => {
      return safeAddresses.map(
        (safeAddress): [PushNotificationPrefsKey, PushNotificationPreferences[PushNotificationPrefsKey]] => {
          const key = getPushNotificationPrefsKey(chainId, safeAddress)

          const defaultPreferences: PushNotificationPreferences[PushNotificationPrefsKey] = {
            chainId,
            safeAddress,
            preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          }

          return [key, defaultPreferences]
        },
      )
    })

    setManyIndexedDb(defaultPreferencesEntries, preferencesStore)
      .then(hydratePreferences)
      .catch((e) => {
        logError(ErrorCodes._706, e)
      })
  }

  // Update preferences for specified Safe
  const updatePreferences = (
    chainId: string,
    safeAddress: string,
    preferences: PushNotificationPreferences[PushNotificationPrefsKey]['preferences'],
  ) => {
    if (!preferencesStore) {
      return
    }

    const key = getPushNotificationPrefsKey(chainId, safeAddress)

    const newPreferences: PushNotificationPreferences[PushNotificationPrefsKey] = {
      safeAddress,
      chainId,
      preferences,
    }

    setIndexedDb(key, newPreferences, preferencesStore)
      .then(hydratePreferences)
      .catch((e) => {
        logError(ErrorCodes._706, e)
      })
  }

  // Delete preferences store entry for specified Safe(s)
  const deletePreferences = (safesToUnregister: NotifiableSafes) => {
    if (!preferencesStore) {
      return
    }

    const keysToDelete = Object.entries(safesToUnregister).flatMap(([chainId, safeAddresses]) => {
      return safeAddresses.map((safeAddress) => getPushNotificationPrefsKey(chainId, safeAddress))
    })

    _deleteManyPreferenceKeys(keysToDelete)
  }

  // Delete all preferences store entries
  const deleteAllChainPreferences = (chainId: string) => {
    if (!preferencesStore) {
      return
    }

    _getAllPreferenceEntries()
      .then((preferencesEntries) => {
        const keysToDelete = preferencesEntries
          .filter(([, prefs]) => {
            return prefs.chainId === chainId
          })
          .map(([key]) => key)

        _deleteManyPreferenceKeys(keysToDelete)
      })
      .catch((e) => {
        logError(ErrorCodes._705, e)
      })
  }

  return {
    uuid,
    getAllPreferences,
    getPreferences,
    updatePreferences,
    createPreferences,
    deletePreferences,
    deleteAllChainPreferences,
    _getAllPreferenceEntries,
    _deleteManyPreferenceKeys,
    getChainPreferences,
  }
}
