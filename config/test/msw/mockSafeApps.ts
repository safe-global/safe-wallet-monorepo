import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { SafeAppAccessPolicyTypes, SafeAppFeatures, SafeAppSocialPlatforms } from '@safe-global/store/gateway/types'

export const transactionBuilderSafeApp: SafeApp = {
  id: 24,
  url: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs',
  name: 'Transaction Builder',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmdVaZxDov4bVARScTLErQSRQoxgqtBad8anWuw3YPQHCs/tx-builder.png',
  description: 'A Safe app to compose custom transactions',
  chainIds: ['1', '4', '5', '56', '100', '137', '246', '73799'],
  accessControl: {
    type: SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://gnosis-safe.io'],
  },
  tags: ['transaction-builder', 'Infrastructure'],
  features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
  socialProfiles: [],
  developerWebsite: 'https://safe.global',
  featured: false,
}

export const compoundSafeApp: SafeApp = {
  id: 13,
  url: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k',
  name: 'Compound',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmX31xCdhFDmJzoVG33Y6kJtJ5Ujw8r5EJJBrsp8Fbjm7k/Compound.png',
  description: 'Money markets on the Ethereum blockchain',
  chainIds: ['1', '4', '137'],
  accessControl: {
    type: SafeAppAccessPolicyTypes.NoRestrictions,
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

export const ensSafeApp: SafeApp = {
  id: 3,
  url: 'https://app.ens.domains',
  name: 'ENS App',
  iconUrl: 'https://app.ens.domains/android-chrome-144x144.png',
  description: 'Decentralised naming for wallets, websites, & more.',
  chainIds: ['1', '4', '137'],
  accessControl: {
    type: SafeAppAccessPolicyTypes.DomainAllowlist,
    value: ['https://gnosis-safe.io'],
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

export const synthetixSafeApp: SafeApp = {
  id: 14,
  url: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA',
  name: 'Synthetix',
  iconUrl: 'https://cloudflare-ipfs.com/ipfs/QmXLxxczMH4MBEYDeeN9zoiHDzVkeBmB5rBjA3UniPEFcA/Synthetix.png',
  description: 'Trade synthetic assets on Ethereum',
  chainIds: ['1', '4', '137'],
  accessControl: {
    type: SafeAppAccessPolicyTypes.NoRestrictions,
  },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

export const txBuilderShareApp: SafeApp = {
  id: 29,
  url: 'https://apps-portal.safe.global/tx-builder',
  name: 'Transaction Builder',
  iconUrl: 'https://apps-portal.safe.global/tx-builder/tx-builder.png',
  description: 'Compose custom contract interactions and batch them into a single transaction',
  chainIds: ['1', '5'],
  accessControl: {
    type: SafeAppAccessPolicyTypes.NoRestrictions,
  },
  tags: ['dashboard-widgets', 'Infrastructure', 'transaction-builder'],
  features: [SafeAppFeatures.BATCHED_TRANSACTIONS],
  developerWebsite: 'https://safe.global',
  socialProfiles: [
    {
      platform: SafeAppSocialPlatforms.DISCORD,
      url: 'https://chat.safe.global',
    },
    {
      platform: SafeAppSocialPlatforms.GITHUB,
      url: 'https://github.com/safe-global',
    },
    {
      platform: SafeAppSocialPlatforms.TWITTER,
      url: 'https://twitter.com/safe',
    },
  ],
  featured: false,
}

// Mock apps for testing sorting and filtering
export const mockSafeAppA: SafeApp = {
  id: 2,
  name: 'A',
  url: 'https://app-a.com',
  iconUrl: '',
  description: '',
  chainIds: ['5'],
  accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

export const mockSafeAppB: SafeApp = {
  id: 1,
  name: 'B',
  url: 'https://app-b.com',
  iconUrl: '',
  description: '',
  chainIds: ['5'],
  accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
  tags: ['test'],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

export const mockSafeAppC: SafeApp = {
  id: 3,
  name: 'C',
  url: 'https://app-c.com',
  iconUrl: '',
  description: '',
  chainIds: ['5'],
  accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
  tags: ['test'],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
}

// Common collections
export const defaultMockSafeApps: SafeApp[] = [compoundSafeApp, ensSafeApp, synthetixSafeApp, transactionBuilderSafeApp]

export const mockSafeAppsForSorting: SafeApp[] = [mockSafeAppB, mockSafeAppA, mockSafeAppC]
