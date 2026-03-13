import type { AllOwnedSafes } from '@safe-global/store/gateway/types'
import mapValues from 'lodash/mapValues'
import difference from 'lodash/difference'
import pickBy from 'lodash/pickBy'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { NotifiableSafes } from './logic'
import type { PushNotificationPreferences } from '@/services/push-notifications/preferences'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'

export const _filterUndeployedSafes = (
  safes: NotifiableSafes | undefined,
  undeployedSafes: UndeployedSafesState,
): NotifiableSafes => {
  return pickBy(
    mapValues(safes, (safeAddresses, chainId) => {
      const undeployedAddresses = undeployedSafes[chainId] ? Object.keys(undeployedSafes[chainId]) : []
      return difference(safeAddresses, undeployedAddresses)
    }),
    (safeAddresses) => safeAddresses.length > 0,
  )
}

export const _transformAddedSafes = (addedSafes: AddedSafesState): NotifiableSafes => {
  return Object.entries(addedSafes).reduce<NotifiableSafes>((acc, [chainId, addedSafesOnChain]) => {
    acc[chainId] = Object.keys(addedSafesOnChain)
    return acc
  }, {})
}

// Convert data structure of currently notified Safes
export const _transformCurrentSubscribedSafes = (
  allPreferences?: PushNotificationPreferences,
): NotifiableSafes | undefined => {
  if (!allPreferences) {
    return
  }

  return Object.values(allPreferences).reduce<NotifiableSafes>((acc, { chainId, safeAddress }) => {
    if (!acc[chainId]) {
      acc[chainId] = []
    }

    acc[chainId].push(safeAddress)
    return acc
  }, {})
}

// Remove Safes that are not on a supported chain
export const _sanitizeNotifiableSafes = (chains: Array<Chain>, notifiableSafes: NotifiableSafes): NotifiableSafes => {
  return Object.entries(notifiableSafes).reduce<NotifiableSafes>((acc, [chainId, safeAddresses]) => {
    const chain = chains.find((chain) => chain.chainId === chainId)

    if (chain) {
      acc[chainId] = safeAddresses
    }

    return acc
  }, {})
}

// Merges added Safes, currently notified Safes, and owned safes into a single data structure without duplicates
export const _mergeNotifiableSafes = (
  ownedSafes: AllOwnedSafes | undefined,
  addedSafes: AddedSafesState,
  currentSubscriptions?: NotifiableSafes,
): NotifiableSafes | undefined => {
  const added = _transformAddedSafes(addedSafes)

  const chains = Array.from(
    new Set([
      ...Object.keys(addedSafes || {}),
      ...Object.keys(currentSubscriptions || {}),
      ...Object.keys(ownedSafes || {}),
    ]),
  )

  let notifiableSafes: NotifiableSafes = {}
  for (const chainId of chains) {
    const ownedSafesOnChain = ownedSafes?.[chainId] ?? []
    const addedSafesOnChain = added[chainId]?.filter((addedAddress) => ownedSafesOnChain.includes(addedAddress)) || []
    const currentSubscriptionsOnChain = currentSubscriptions?.[chainId] || []
    // The display order of safes will be subscribed, added & owned, owned
    const uniqueSafeAddresses = Array.from(
      new Set([...currentSubscriptionsOnChain, ...addedSafesOnChain, ...ownedSafesOnChain]),
    )
    notifiableSafes[chainId] = uniqueSafeAddresses
  }

  return notifiableSafes
}

export const _getTotalNotifiableSafes = (notifiableSafes: NotifiableSafes): number => {
  return Object.values(notifiableSafes).reduce((acc, safeAddresses) => {
    return (acc += safeAddresses.length)
  }, 0)
}

export const _areAllSafesSelected = (notifiableSafes: NotifiableSafes, selectedSafes: NotifiableSafes): boolean => {
  const entries = Object.entries(notifiableSafes)

  if (entries.length === 0) {
    return false
  }

  return Object.entries(notifiableSafes).every(([chainId, safeAddresses]) => {
    const hasChain = Object.keys(selectedSafes).includes(chainId)
    const hasEverySafe = safeAddresses?.every((safeAddress) => selectedSafes[chainId]?.includes(safeAddress))
    return hasChain && hasEverySafe
  })
}

// Total number of signatures required to register selected Safes
export const _getTotalSignaturesRequired = (
  selectedSafes: NotifiableSafes,
  currentNotifiedSafes?: NotifiableSafes,
): number => {
  return Object.entries(selectedSafes)
    .filter(([, safeAddresses]) => safeAddresses.length > 0)
    .reduce((acc, [chainId, safeAddresses]) => {
      const isNewChain = !currentNotifiedSafes?.[chainId]
      const isNewSafe = safeAddresses.some((safeAddress) => !currentNotifiedSafes?.[chainId]?.includes(safeAddress))

      if (isNewChain || isNewSafe) {
        acc += 1
      }
      return acc
    }, 0)
}

export const _shouldRegisterSelectedSafes = (
  selectedSafes: NotifiableSafes,
  currentNotifiedSafes?: NotifiableSafes,
): boolean => {
  return Object.entries(selectedSafes).some(([chainId, safeAddresses]) => {
    return safeAddresses.some((safeAddress) => !currentNotifiedSafes?.[chainId]?.includes(safeAddress))
  })
}

export const _shouldUnregsiterSelectedSafes = (
  selectedSafes: NotifiableSafes,
  currentNotifiedSafes?: NotifiableSafes,
) => {
  return Object.entries(currentNotifiedSafes || {}).some(([chainId, safeAddresses]) => {
    return safeAddresses.some((safeAddress) => !selectedSafes[chainId]?.includes(safeAddress))
  })
}

// Safes that need to be registered with the service
export const _getSafesToRegister = (
  selectedSafes: NotifiableSafes,
  currentNotifiedSafes?: NotifiableSafes,
): NotifiableSafes | undefined => {
  const safesToRegister = Object.entries(selectedSafes).reduce<NotifiableSafes>((acc, [chainId, safeAddresses]) => {
    const safesToRegisterOnChain = safeAddresses.filter(
      (safeAddress) => !currentNotifiedSafes?.[chainId]?.includes(safeAddress),
    )

    if (safesToRegisterOnChain.length > 0) {
      acc[chainId] = safesToRegisterOnChain
    }

    return acc
  }, {})

  const shouldRegister = Object.values(safesToRegister).some((safeAddresses) => safeAddresses.length > 0)

  if (shouldRegister) {
    return safesToRegister
  }
}

// Safes that need to be unregistered with the service
export const _getSafesToUnregister = (
  selectedSafes: NotifiableSafes,
  currentNotifiedSafes?: NotifiableSafes,
): NotifiableSafes | undefined => {
  if (!currentNotifiedSafes) {
    return
  }

  const safesToUnregister = Object.entries(currentNotifiedSafes).reduce<NotifiableSafes>(
    (acc, [chainId, safeAddresses]) => {
      const safesToUnregisterOnChain = safeAddresses.filter(
        (safeAddress) => !selectedSafes[chainId]?.includes(safeAddress),
      )

      if (safesToUnregisterOnChain.length > 0) {
        acc[chainId] = safesToUnregisterOnChain
      }
      return acc
    },
    {},
  )

  const shouldUnregister = Object.values(safesToUnregister).some((safeAddresses) => safeAddresses.length > 0)

  if (shouldUnregister) {
    return safesToUnregister
  }
}

// Whether the device needs to be unregistered from the service
export const _shouldUnregisterDevice = (
  chainId: string,
  safeAddresses: Array<string>,
  currentNotifiedSafes?: NotifiableSafes,
): boolean => {
  if (!currentNotifiedSafes) {
    return false
  }

  if (safeAddresses.length !== currentNotifiedSafes[chainId].length) {
    return false
  }

  return safeAddresses.every((safeAddress) => {
    return currentNotifiedSafes[chainId]?.includes(safeAddress)
  })
}
