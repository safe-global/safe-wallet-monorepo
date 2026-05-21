import { createAppKit } from '@reown/appkit-react-native'
import { EthersAdapter } from '@reown/appkit-ethers-react-native'
import type { Network, Storage } from '@reown/appkit-common-react-native'
import { createMMKV } from 'react-native-mmkv'
import { safeJsonParse, safeJsonStringify } from '@walletconnect/safe-json'

const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID ?? ''

const ethersAdapter = new EthersAdapter()

const mmkv = createMMKV({ id: 'appkit' })

const storage: Storage = {
  getKeys: async () => {
    return mmkv.getAllKeys()
  },
  getEntries: async <T = unknown>(): Promise<[string, T][]> => {
    function parseEntry(key: string): [string, T] {
      const value = mmkv.getString(key)
      return [key, safeJsonParse(value ?? '') as T]
    }

    const keys = mmkv.getAllKeys()
    return keys.map(parseEntry)
  },
  setItem: async <T = unknown>(key: string, value: T) => {
    return mmkv.set(key, safeJsonStringify(value))
  },
  getItem: async <T = unknown>(key: string): Promise<T | undefined> => {
    const item = mmkv.getString(key)
    if (typeof item === 'undefined' || item === null) {
      return undefined
    }

    return safeJsonParse(item) as T
  },
  removeItem: async (key: string) => {
    await mmkv.remove(key)
  },
}

export type AppKitInstance = ReturnType<typeof createAppKit>

/**
 * Create the AppKit singleton with dynamic networks.
 *
 * WARNING: Due to the Reown singleton pattern (Symbol.for('__REOWN_APPKIT_INSTANCE__')),
 * this can only be called once per app session. Subsequent calls return the existing
 * instance and ignore the provided config.
 */
export function createAppKitInstance(networks: [Network, ...Network[]], defaultNetwork?: Network): AppKitInstance {
  return createAppKit({
    projectId,
    networks,
    defaultNetwork: defaultNetwork ?? networks[0],
    adapters: [ethersAdapter],
    storage,
    metadata: {
      name: 'Safe{Mobile}',
      description: 'Safe multi-signature wallet',
      url: 'https://app.safe.global',
      icons: ['https://app.safe.global/favicons/favicon.ico'],
    },
    features: {
      onramp: false,
      swaps: false,
      socials: false,
      showWallets: true,
    },
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger Live
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '5d9f1395b3a8e848684848dc4147cbd05c8d54bb737eac78fe103901fe6b01a1', // OKX Wallet
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    ],
    includeWalletIds: [
      '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66', // TokenPocket
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18', // Zerion
      '1aedbcfc1f31aade56ca34c38b0a1607b41cccfa3de93c946ef3b4ba2dfab11c', // OneKey
      '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget Wallet
      '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150', // SafePal
      '15c8b91ade1a4e58f3ce4e7a0dd7f42b47db0c8df7e0d84f63eb39bcb96c4e0f', // Bybit Wallet
    ],
    themeVariables: {
      accent: '#12FF80',
    },
    // Reown SDK fires telemetry to api.web3modal.org when this is undefined.
    // We have our own opt-in analytics; never send data to Reown.
    enableAnalytics: false,
    debug: __DEV__,
  })
}
