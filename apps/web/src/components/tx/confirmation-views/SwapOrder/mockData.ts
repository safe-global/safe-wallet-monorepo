import { mockAddress } from '@/stories/mocks/address'
import type {
  SwapOrderTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Fixed timestamp for deterministic tests: Dec 24, 2024
const FIXED_TIMESTAMP = 1735000000

export const mockSwapOrderTxInfo: SwapOrderTransactionInfo = {
  type: TransactionInfoType.SWAP_ORDER,
  humanDescription: null,
  uid: '5f3c8a2e-9b1d-4e7a-8c6f-2d4b1a9e7c30',
  kind: 'sell',
  orderClass: 'market',
  validUntil: FIXED_TIMESTAMP + 3600,
  sellAmount: '2000000000000000000',
  buyAmount: '6800000000000000000',
  executedSellAmount: '0',
  executedBuyAmount: '0',
  executedFee: '0',
  executedFeeToken: {
    address: mockAddress(1),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  sellToken: {
    address: mockAddress(2),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  buyToken: {
    address: mockAddress(3),
    decimals: 6,
    logoUri:
      'mock-assets/safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.webp',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  receiver: mockAddress(4),
  owner: mockAddress(5),
  fullAppData: null,
  status: 'open',
  explorerUrl: 'https://explorer.cow.fi/orders/0x123abc',
}

export const mockTwapOrderTxInfo: TwapOrderTransactionInfo = {
  type: TransactionInfoType.TWAP_ORDER,
  humanDescription: null,
  kind: 'sell',
  validUntil: FIXED_TIMESTAMP + 86400,
  startTime: {
    startType: 'AT_EPOCH',
    epoch: FIXED_TIMESTAMP,
  },
  durationOfPart: {
    durationType: 'AUTO',
  },
  timeBetweenParts: 3600,
  minPartLimit: '500000000000000000',
  numberOfParts: '10',
  partSellAmount: '5000000000000000000',
  sellAmount: '50000000000000000000',
  buyAmount: '170000000000000000000',
  executedSellAmount: '3000000000000000000',
  executedBuyAmount: '5000000000000000000',
  executedFee: '0',
  executedFeeToken: {
    address: mockAddress(6),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  sellToken: {
    address: mockAddress(7),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  buyToken: {
    address: mockAddress(8),
    decimals: 6,
    logoUri:
      'mock-assets/safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.webp',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  receiver: mockAddress(9),
  owner: mockAddress(10),
  fullAppData: null,
  status: 'open',
}

export const mockSwapOrderTxData: TransactionDetails['txData'] = {
  hexData: '0x',
  dataDecoded: null,
  to: {
    value: mockAddress(11),
    name: 'CoW Swap Settlement',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
