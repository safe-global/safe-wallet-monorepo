import type { PropsWithChildren } from 'react'
import type SafeAppsSDK from '@safe-global/safe-apps-sdk'
import type { ChainInfo, SafeInfo } from '@safe-global/safe-apps-sdk'

export const SAFE_INFO: SafeInfo = {
  safeAddress: '0x4DD4cB2299E491E1B469245DB589ccB2B16d7bde',
  chainId: 11155111,
  threshold: 1,
  owners: ['0xc6b82bA149CFA113f8f48d5E3b1F78e933e16DfD'],
  isReadOnly: false,
}

export const CHAIN_INFO: ChainInfo = {
  chainName: 'Sepolia',
  chainId: '11155111',
  shortName: 'sep',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
  blockExplorerUriTemplate: {
    address: 'https://sepolia.etherscan.io/address/{{address}}',
    txHash: 'https://sepolia.etherscan.io/tx/{{txHash}}',
    api: 'https://api-sepolia.etherscan.io/api',
  },
}

const ZERO_WORD = `0x${'0'.repeat(64)}`

const LATEST_BLOCK = {
  hash: `0x${'1'.repeat(64)}`,
  parentHash: ZERO_WORD,
  number: '0x1',
  timestamp: '0x1',
  nonce: '0x0000000000000000',
  difficulty: '0x0',
  gasLimit: '0x1c9c380',
  gasUsed: '0x0',
  miner: '0x0000000000000000000000000000000000000000',
  extraData: '0x',
  baseFeePerGas: '0x0',
  transactions: [],
}

const fakeSdk = {
  safe: {
    getChainInfo: jest.fn(async () => CHAIN_INFO),
    requestAddressBook: jest.fn(async () => []),
  },
  eth: {
    call: jest.fn(async () => '0x'),
    getCode: jest.fn(async () => '0x'),
    getStorageAt: jest.fn(async () => ZERO_WORD),
    getBlockByNumber: jest.fn(async () => LATEST_BLOCK),
  },
}

export const safeAppsReactSdkFake = {
  SafeProvider: ({ children }: PropsWithChildren) => children,
  useSafeAppsSDK: () => ({ sdk: fakeSdk as unknown as SafeAppsSDK, safe: SAFE_INFO, connected: true }),
}
