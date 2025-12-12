import { faker } from '@faker-js/faker'
import type { SwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

export const mockLifiSwapTxInfo: SwapTransactionInfo = {
  type: TransactionInfoType.SWAP,
  humanDescription: null,
  fromAmount: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  toAmount: faker.number.bigInt({ min: 2000000000000000000n, max: 20000000000000000000n }).toString(),
  fromToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
  },
  toToken: {
    address: faker.finance.ethereumAddress(),
    decimals: 6,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  recipient: {
    value: faker.finance.ethereumAddress(),
    name: faker.person.fullName(),
    logoUri: null,
  },
  fees: {
    tokenAddress: faker.finance.ethereumAddress(),
    integratorFee: '5000000000000000',
    lifiFee: '3000000000000000',
  },
  lifiExplorerUrl: 'https://explorer.li.fi/tx/0x123abc',
}
