import { faker } from '@faker-js/faker'
import type {
  SwapOrderTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Seed faker for deterministic values in stories
faker.seed(123)

// Fixed timestamp for deterministic tests: Dec 24, 2024
const FIXED_TIMESTAMP = 1735000000

export const mockSwapOrderTxInfo: SwapOrderTransactionInfo = {
  type: TransactionInfoType.SWAP_ORDER,
  humanDescription: null,
  uid: faker.string.uuid(),
  kind: 'sell',
  orderClass: 'market',
  validUntil: FIXED_TIMESTAMP + 3600,
  sellAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  buyAmount: faker.number.bigInt({ min: 2000000000000000000n, max: 20000000000000000000n }).toString(),
  executedSellAmount: '0',
  executedBuyAmount: '0',
  executedFee: '0',
  executedFeeToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  sellToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  buyToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 6,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  receiver: faker.finance.ethereumAddress(),
  owner: faker.finance.ethereumAddress(),
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
  minPartLimit: faker.number.bigInt({ min: 100000000000000000n, max: 1000000000000000000n }).toString(),
  numberOfParts: '10',
  partSellAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  sellAmount: faker.number.bigInt({ min: 10000000000000000000n, max: 100000000000000000000n }).toString(),
  buyAmount: faker.number.bigInt({ min: 20000000000000000000n, max: 200000000000000000000n }).toString(),
  executedSellAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 5000000000000000000n }).toString(),
  executedBuyAmount: faker.number.bigInt({ min: 2000000000000000000n, max: 10000000000000000000n }).toString(),
  executedFee: '0',
  executedFeeToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  sellToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  buyToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 6,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  receiver: faker.finance.ethereumAddress(),
  owner: faker.finance.ethereumAddress(),
  fullAppData: null,
  status: 'open',
}

export const mockSwapOrderTxData: TransactionDetails['txData'] = {
  hexData: '0x',
  dataDecoded: null,
  to: {
    value: faker.finance.ethereumAddress(),
    name: 'CoW Swap Settlement',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
