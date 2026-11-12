import { mockAddress } from '@/stories/mocks/address'
import type { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

export const mockVaultRedeemTxInfo: VaultRedeemTransactionInfo = {
  type: TransactionInfoType.VAULT_REDEEM,
  humanDescription: null,
  value: '4000000000000000000',
  tokenInfo: {
    address: mockAddress(1),
    decimals: 18,
    logoUri:
      'mock-assets/safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.webp',
    name: 'USD Coin',
    symbol: 'USDC',
    trusted: true,
  },
  vaultInfo: {
    address: mockAddress(2),
    name: 'Morpho USDC Vault',
    description:
      'A high-yield USDC vault powered by Morpho protocol, optimizing lending rates across multiple markets.',
    logoUri: 'https://example.com/morpho-logo.png',
  },
  baseNrr: 450,
  additionalRewardsNrr: 150,
  fee: 500,
  currentReward: '120000000000000000',
  additionalRewards: [
    {
      tokenInfo: {
        address: mockAddress(3),
        decimals: 18,
        logoUri: 'mock-assets/safe-transaction-assets.safe.global/chains/1/currency_logo.webp',
        name: 'Morpho Token',
        symbol: 'MORPHO',
        trusted: true,
      },
      nrr: 150,
      claimable: '40000000000000000',
      claimableNext: '15000000000000000',
    },
  ],
}

export const mockVaultRedeemTxInfoWithoutAdditionalRewards: VaultRedeemTransactionInfo = {
  ...mockVaultRedeemTxInfo,
  additionalRewards: [],
  additionalRewardsNrr: 0,
}
