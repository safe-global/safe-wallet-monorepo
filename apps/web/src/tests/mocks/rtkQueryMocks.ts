/**
 * Mock implementations for RTK Query hooks used in tests
 * This provides default mock data for hooks that were migrated from Redux slices to RTK Query
 */

import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { TransactionItemPage, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

// Default mock data
export const mockSafeInfo: SafeState = {
  address: { value: '0x0000000000000000000000000000000000000001' },
  chainId: '1',
  nonce: 0,
  threshold: 1,
  owners: [{ value: '0x0000000000000000000000000000000000000002' }],
  implementation: { value: '0x0000000000000000000000000000000000000003' },
  modules: [],
  fallbackHandler: null,
  guard: null,
  version: '1.3.0',
  implementationVersionState: 'UP_TO_DATE',
}

export const mockBalances: Balances = {
  fiatTotal: '0',
  items: [],
}

export const mockTxHistory: TransactionItemPage = {
  results: [],
  next: null,
  previous: null,
}

export const mockTxQueue: QueuedItemPage = {
  results: [],
  next: null,
  previous: null,
}

export const mockChains: { results: Chain[] } = {
  results: [
    {
      chainId: '1',
      chainName: 'Ethereum',
      description: 'Ethereum Mainnet',
      chainLogoUri: null,
      l2: false,
      isTestnet: false,
      zk: false,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
        logoUri: '',
      },
      transactionService: 'https://safe-transaction-mainnet.safe.global',
      blockExplorerUriTemplate: {
        address: 'https://etherscan.io/address/{{address}}',
        txHash: 'https://etherscan.io/tx/{{txHash}}',
        api: 'https://api.etherscan.io/api?module={{module}}&action={{action}}&address={{address}}&apiKey={{apiKey}}',
      },
      beaconChainExplorerUriTemplate: {},
      disabledWallets: [],
      features: [],
      gasPrice: [],
      publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://eth.llamarpc.com' },
      rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://eth.llamarpc.com' },
      safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://eth.llamarpc.com' },
      shortName: 'eth',
      theme: { textColor: '#ffffff', backgroundColor: '#000000' },
      ensRegistryAddress: null,
      recommendedMasterCopyVersion: '1.3.0',
      balancesProvider: { enabled: true, chainName: 'ethereum' },
      contractAddresses: {
        safeSingletonAddress: null,
        safeProxyFactoryAddress: null,
        multiSendAddress: null,
        multiSendCallOnlyAddress: null,
        fallbackHandlerAddress: null,
        signMessageLibAddress: null,
        createCallAddress: null,
        simulateTxAccessorAddress: null,
        safeWebAuthnSignerFactoryAddress: null,
      },
    },
  ],
}

export const mockSafeMessages: MessagePage = {
  results: [],
  next: null,
  previous: null,
}

/**
 * Helper to create RTK Query mock return value
 */
export function createRtkQueryMock<T>(data: T, options: { isLoading?: boolean; error?: unknown } = {}) {
  return {
    currentData: options.isLoading ? undefined : data,
    data: options.isLoading ? undefined : data,
    error: options.error,
    isLoading: options.isLoading ?? false,
    isFetching: options.isLoading ?? false,
    isSuccess: !options.isLoading && !options.error,
    isError: !!options.error,
    refetch: jest.fn(),
  }
}
