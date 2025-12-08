import { faker } from '@faker-js/faker'
import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

export const mockVaultRedeemTxInfo: VaultRedeemTransactionInfo = {
  type: TransactionInfoType.VAULT_REDEEM,
  humanDescription: null,
  value: faker.number.bigInt({ min: 1000000000000000000n, max: 10000000000000000000n }).toString(),
  tokenInfo: {
    address: faker.finance.ethereumAddress(),
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  vaultInfo: {
    address: faker.finance.ethereumAddress(),
    name: 'Morpho USDC Vault',
    description: 'A high-yield USDC vault powered by Morpho protocol, optimizing lending rates across multiple markets.',
    logoUri: 'https://example.com/morpho-logo.png',
  },
  additionalRewardsNrr: 150,
  currentReward: faker.number.bigInt({ min: 50000000000000000n, max: 500000000000000000n }).toString(),
  additionalRewards: [
    {
      tokenInfo: {
        address: faker.finance.ethereumAddress(),
        decimals: 18,
        logoUri: 'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png',
        name: 'Morpho Token',
        symbol: 'MORPHO',
        trusted: true,
      },
      nrr: 150,
      claimable: faker.number.bigInt({ min: 10000000000000000n, max: 100000000000000000n }).toString(),
      claimableNext: faker.number.bigInt({ min: 5000000000000000n, max: 50000000000000000n }).toString(),
    },
  ],
}

export const mockVaultRedeemTxInfoWithoutAdditionalRewards: VaultRedeemTransactionInfo = {
  ...mockVaultRedeemTxInfo,
  additionalRewards: [],
  additionalRewardsNrr: 0,
}
