import { mockAddress } from '@/stories/mocks/address'
import type { BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const mockPendingBridgeTxInfo: BridgeAndSwapTransactionInfo = {
  type: 'SwapAndBridge',
  humanDescription: null,
  fromAmount: '3500000000000000000',
  toAmount: '3480000000000000000',
  fromToken: {
    address: mockAddress(1),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  toToken: {
    address: mockAddress(2),
    decimals: 18,
    logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  toChain: '10',
  recipient: {
    value: mockAddress(3),
    name: 'Alice Martin',
    logoUri: null,
  },
  status: 'PENDING',
  substatus: 'WAIT_SOURCE_CONFIRMATIONS',
  fees: {
    tokenAddress: mockAddress(4),
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
