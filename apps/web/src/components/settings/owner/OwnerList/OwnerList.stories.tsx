import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { SAFE_ADDRESSES, safeFixtures, chainFixtures } from '../../../../../../../config/test/msw/fixtures'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { OwnerList } from './index'

// Create chain data without complex features
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter(
    (f: string) => !['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE'].includes(f),
  )
  return chainData
}

// Create MSW handlers
const createHandlers = () => {
  const chainData = createChainData()

  return [
    // Chain config
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
  ]
}

const { chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

// Mock wallet context - first owner
const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: safeFixtures.efSafe.owners[0].value,
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: safeFixtures.efSafe.owners[0].value,
    chainId: MOCK_CHAIN_ID,
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock non-owner wallet
const mockNonOwnerWallet: WalletContextType = {
  connectedWallet: {
    address: '0x9999999999999999999999999999999999999999',
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: '0x9999999999999999999999999999999999999999',
    chainId: MOCK_CHAIN_ID,
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock TxModal context
const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

// Mock SDK Provider
const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

// Realistic-looking owner addresses for stories
const MOCK_OWNER_ADDRESSES = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xdeadbeef1234567890abcdef1234567890abcdef',
  '0xcafebabe9876543210fedcba9876543210fedcba',
  '0xfaceb00c1234567890abcdef1234567890abcdef',
  '0xb0bacafe9876543210fedcba9876543210fedcba',
]

// Create safe data with different owner counts
const createSafeWithOwners = (ownerCount: number, threshold: number = 2) => {
  const owners = Array.from({ length: ownerCount }, (_, i) => ({
    value: MOCK_OWNER_ADDRESSES[i] || `0x${(i + 1).toString(16).padStart(40, 'a')}`,
    name: null,
  }))

  return {
    ...safeFixtures.efSafe,
    owners,
    threshold: Math.min(threshold, ownerCount),
  }
}

// Address book entries for named owners (regular names)
// Note: Address book state is keyed by chainId, then by address
const createAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  owners.forEach((owner, i) => {
    if (i < 3) {
      // Only name first 3 owners to show mixed display
      book[owner.value] = ['Alice', 'Bob', 'Charlie'][i]
    }
  })
  return { [chainId]: book }
}

// Address book entries with ENS-style names
const createEnsAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  const ensNames = ['vitalik.eth', 'safe.eth', 'alice.eth', 'bob.eth', 'charlie.eth']
  owners.forEach((owner, i) => {
    if (i < ensNames.length) {
      book[owner.value] = ensNames[i]
    }
  })
  return { [chainId]: book }
}

// Mixed address book with some ENS, some regular names, some unnamed
const createMixedAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  if (owners[0]) book[owners[0].value] = 'vitalik.eth' // ENS name
  if (owners[1]) book[owners[1].value] = 'Treasury Wallet' // Regular name
  // owners[2] intentionally left unnamed to show address
  if (owners[3]) book[owners[3].value] = 'safe-team.eth' // ENS name
  return { [chainId]: book }
}

const meta = {
  title: 'Settings/OwnerList',
  component: OwnerList,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createHandlers(),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: safeData,
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
} satisfies Meta<typeof OwnerList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default OwnerList showing the EF Safe owners.
 * Connected wallet is an owner, so action buttons are enabled.
 */
export const Default: Story = {
  loaders: [mswLoader],
}

/**
 * Safe with 2 owners (2-of-2 multisig).
 * Shows remove button for both owners.
 */
export const TwoOwners: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = createSafeWithOwners(2, 2)
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: { ...safeData, deployed: true },
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Safe with a single owner (1-of-1).
 * Remove button is hidden since there must be at least one owner.
 */
export const SingleOwner: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = createSafeWithOwners(1, 1)
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: { ...safeData, deployed: true },
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Safe with many owners (5-of-7 multisig).
 * Tests list rendering with larger owner counts.
 */
export const ManyOwners: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = createSafeWithOwners(7, 5)
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: { ...safeData, deployed: true },
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * View as non-owner.
 * Action buttons are disabled when not connected as an owner.
 */
export const NonOwnerView: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockNonOwnerWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: safeData,
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Owners with ENS-style names from address book.
 * Shows how owners display when they have .eth domain names saved.
 */
export const WithEnsNames: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = createSafeWithOwners(4, 3)
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: { ...safeData, deployed: true },
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createEnsAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Mixed display: some owners with ENS names, some with regular names, some with just addresses.
 * Demonstrates typical real-world scenario with partial address book coverage.
 */
export const MixedAddressBook: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = createSafeWithOwners(5, 3)
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={{
                  safeInfo: {
                    data: { ...safeData, deployed: true },
                    loading: false,
                    loaded: true,
                  },
                  chains: {
                    data: [chainData],
                    loading: false,
                  },
                  addressBook: createMixedAddressBook(safeData.owners),
                  settings: {
                    currency: 'usd',
                    hiddenTokens: {},
                    tokenList: TOKEN_LISTS.ALL,
                    shortName: { copy: true, qr: true },
                    theme: { darkMode: isDarkMode },
                    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
                    signing: { onChainSigning: false, blindSigning: false },
                    transactionExecution: true,
                  },
                }}
              >
                <AddressBookSourceProvider source="localOnly">
                  <Paper sx={{ p: 3, maxWidth: 800 }}>
                    <Story />
                  </Paper>
                </AddressBookSourceProvider>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}
