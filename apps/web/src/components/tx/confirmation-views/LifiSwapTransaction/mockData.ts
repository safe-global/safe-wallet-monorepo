import { mockAddress } from '@/stories/mocks/address'
import type { SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

export const mockLifiSwapTxInfo: SwapTransactionInfo = {
  type: TransactionInfoType.SWAP,
  humanDescription: null,
  fromAmount: '4200000000000000000',
  toAmount: '12600000000000000000',
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
    decimals: 6,
    logoUri:
      'mock-assets/safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.webp',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  recipient: {
    value: mockAddress(3),
    name: 'Bob Chen',
    logoUri: null,
  },
  fees: {
    tokenAddress: mockAddress(4),
    integratorFee: '5000000000000000',
    lifiFee: '3000000000000000',
  },
  lifiExplorerUrl: 'https://explorer.li.fi/tx/0x123abc',
}
