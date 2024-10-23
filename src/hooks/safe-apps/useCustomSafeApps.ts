import { useState, useEffect, useCallback } from 'react'
import type {
  SafeAppAccessPolicyTypes,
  SafeAppData,
  SafeAppSocialPlatforms,
} from '@safe-global/safe-gateway-typescript-sdk'
import local from '@/services/local-storage/local'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import useChainId from '@/hooks/useChainId'

type ReturnType = {
  customSafeApps: SafeAppData[]
  loading: boolean
  updateCustomSafeApps: (newCustomSafeApps: SafeAppData[]) => void
}

const CUSTOM_SAFE_APPS_STORAGE_KEY = 'customSafeApps'

const getChainSpecificSafeAppsStorageKey = (chainId: string) => `${CUSTOM_SAFE_APPS_STORAGE_KEY}-${chainId}`

type StoredCustomSafeApp = { url: string }

/*
  This hook is used to manage the list of custom safe apps.
  What it does:
  1. Loads a list of custom safe apps from local storage
  2. Does some backward compatibility checks (supported app networks, etc)
  3. Tries to fetch the app info (manifest.json) from the app url
*/
const useCustomSafeApps = (): ReturnType => {
  const [customSafeApps, setCustomSafeApps] = useState<SafeAppData[]>(fakeSafeApps)
  const [loading, setLoading] = useState(false)
  const chainId = useChainId()

  const updateCustomSafeApps = useCallback(
    (newCustomSafeApps: SafeAppData[]) => {
      setCustomSafeApps(newCustomSafeApps)

      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      local.setItem(
        chainSpecificSafeAppsStorageKey,
        newCustomSafeApps.map((app) => ({ url: app.url })),
      )
    },
    [chainId],
  )

  useEffect(() => {
    const loadCustomApps = async () => {
      setLoading(true)
      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      const storedApps = local.getItem<StoredCustomSafeApp[]>(chainSpecificSafeAppsStorageKey) || []
      const appManifests = await Promise.allSettled(storedApps.map((app) => fetchSafeAppFromManifest(app.url, chainId)))
      const resolvedApps = appManifests
        .filter((promiseResult) => promiseResult.status === 'fulfilled')
        .map((promiseResult) => (promiseResult as PromiseFulfilledResult<SafeAppData>).value)

      setLoading(false)
    }

    loadCustomApps()
  }, [chainId])

  return { customSafeApps, loading, updateCustomSafeApps }
}

export { useCustomSafeApps }

const fakeSafeApps: SafeAppData[] = [
  {
    id: 0.21472726789485663,
    url: 'https://raffle.superchain.eco/',
    name: 'Super Chain Raffle',
    description: 'Participate in weekly free raffle by claiming tickets based on your level.',
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    tags: ['DeFi', 'Gaming'],
    features: [],
    socialProfiles: [],
    developerWebsite: '',
    chainIds: ['10'],
    iconUrl: 'https://account.superchain.eco/images/apps/raffle.jpg',
  },
  {
    id: 48,
    url: 'https://app.superfluid.finance/',
    name: 'Superfluid',
    iconUrl: 'https://safe-transaction-assets.safe.global/safe_apps/48/icon.png',
    description:
      'Superfluid is a new Ethereum Protocol that extends Ethereum tokens to include novel functionalities. Superfluid enables functionalities like money streaming and reward distribution.',
    chainIds: ['10'],
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    tags: ['Accounting', 'DAO Tooling', 'Payments'],
    features: [],
    developerWebsite: 'https://superfluid.finance',
    socialProfiles: [
      {
        platform: 'DISCORD' as SafeAppSocialPlatforms,
        url: 'http://discord.superfluid.finance',
      },
      {
        platform: 'GITHUB' as SafeAppSocialPlatforms,
        url: 'https://github.com/superfluid-finance',
      },
      {
        platform: 'TWITTER' as SafeAppSocialPlatforms,
        url: 'https://twitter.com/Superfluid_HQ',
      },
    ],
  },
  {
    id: 152,
    url: 'https://velodrome.finance',
    name: 'Velodrome Finance',
    iconUrl: 'https://account.superchain.eco/images/apps/velodrome.jpg',
    description:
      'Velodrome Finance is a next-generation AMM that combines the best of Curve, Convex and Uniswap, designed to serve as the central liquidity hub on Optimism network. Velodrome NFTs vote on token emissio',
    chainIds: ['10'],
    provider: undefined,
    accessControl: {
      type: 'NO_RESTRICTIONS' as SafeAppAccessPolicyTypes,
      value: [],
    },
    tags: ['DeFi', 'Governance', 'Yield'],
    features: [],
    developerWebsite: 'https://velodrome.finance',
    socialProfiles: [
      {
        platform: 'DISCORD' as SafeAppSocialPlatforms,
        url: 'https://discord.gg/velodrome',
      },
      {
        platform: 'GITHUB' as SafeAppSocialPlatforms,
        url: 'https://github.com/velodrome-finance',
      },
      {
        platform: 'TWITTER' as SafeAppSocialPlatforms,
        url: 'https://twitter.com/velodromeFi',
      },
    ],
  },
]
