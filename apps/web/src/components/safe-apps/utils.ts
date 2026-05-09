import { isHexString, toUtf8String } from 'ethers'
import { SafeAppAccessPolicyTypes, SafeAppFeatures } from '@safe-global/store/gateway/types'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'

import { validateAddress } from '@safe-global/utils/utils/validation'
import type { SafeAppDataWithPermissions } from './types'
import { SafeAppsTag } from '@/config/constants'

const validateTransaction = (t: BaseTransaction): boolean => {
  if (!['string', 'number'].includes(typeof t.value)) {
    return false
  }

  if (typeof t.value === 'string' && !/^(0x)?[0-9a-f]+$/i.test(t.value)) {
    return false
  }

  const isAddressValid = validateAddress(t.to) === undefined
  return isAddressValid && !!t.data && typeof t.data === 'string'
}

export const isTxValid = (txs: BaseTransaction[]): boolean => txs.length > 0 && txs.every((t) => validateTransaction(t))

/**
 * If message is a hex value and is Utf8 encoded string we decode it, else we return the raw message
 * @param {string} message raw input message
 * @returns {string}
 */
export const getDecodedMessage = (message: string): string => {
  if (isHexString(message)) {
    // If is a hex string we try to extract a message
    try {
      return toUtf8String(message)
    } catch (e) {
      // the hex string is not UTF8 encoding so we will return the raw message.
    }
  }

  return message
}

export const getLegacyChainName = (chainName: string, chainId: string): string => {
  let network = chainName

  switch (chainId) {
    case '1':
      network = 'MAINNET'
      break
    case '100':
      network = 'XDAI'
  }

  return network
}

export const getEmptySafeApp = (url = '', appData?: SafeAppData): SafeAppDataWithPermissions => {
  return {
    id: Math.round(Math.random() * 1e9 + 1e6),
    url,
    name: 'unknown',
    iconUrl: '/images/apps/apps-icon.svg',
    description: '',
    chainIds: [],
    accessControl: {
      type: SafeAppAccessPolicyTypes.NoRestrictions,
    },
    tags: [],
    features: [],
    developerWebsite: '',
    socialProfiles: [],
    featured: false,
    ...appData,
    safeAppsPermissions: [],
  }
}

export const getOrigin = (url?: string): string => {
  if (!url) return ''

  const { origin } = new URL(url)

  return origin
}

export const isOptimizedForBatchTransactions = (safeApp: SafeAppData) =>
  safeApp.features?.includes(SafeAppFeatures.BATCHED_TRANSACTIONS)

// some categories are used internally and we dont want to display them in the UI
export const filterInternalCategories = (categories: string[]): string[] => {
  const internalCategories = Object.values(SafeAppsTag)
  return categories.filter((tag) => !internalCategories.some((internalCategory) => tag === internalCategory))
}

// Get unique tags from all apps
export const getUniqueTags = (apps: SafeAppData[]): string[] => {
  // Get the list of categories from the safeAppsList
  const tags = apps.reduce<Set<string>>((result, app) => {
    app.tags.forEach((tag) => result.add(tag))
    return result
  }, new Set())

  // Filter out internal tags
  const filteredTags = filterInternalCategories(Array.from(tags))

  // Sort alphabetically
  return filteredTags.sort()
}
