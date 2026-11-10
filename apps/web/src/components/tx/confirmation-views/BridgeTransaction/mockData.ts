import { faker } from '@faker-js/faker'
import type { BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const mockPendingBridgeTxInfo: BridgeAndSwapTransactionInfo = {
  type: 'SwapAndBridge',
  humanDescription: null,
  fromAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  toAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  fromToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  toToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  toChain: '10',
  recipient: {
    value: faker.finance.ethereumAddress(),
    name: faker.person.fullName(),
    logoUri: null,
  },
  status: 'PENDING',
  substatus: 'WAIT_SOURCE_CONFIRMATIONS',
  fees: {
    tokenAddress: faker.finance.ethereumAddress(),
    integratorFee: '1000000000000000',
    lifiFee: '2000000000000000',
  },
  explorerUrl: 'https://explorer.li.fi/tx/0x123abc',
}

export const mockFailedBridgeTxInfo: BridgeAndSwapTransactionInfo = {
  ...mockPendingBridgeTxInfo,
  status: 'FAILED',
  substatus: 'INSUFFICIENT_BALANCE',
}

export const mockSuccessfulBridgeTxInfo: BridgeAndSwapTransactionInfo = {
  ...mockPendingBridgeTxInfo,
  status: 'DONE',
  substatus: 'COMPLETED',
}
