import React from 'react'
import { render } from '@/src/tests/test-utils'
import { VaultTxRedeemCard } from './VaultTxRedeemCard'
import { VaultRedeemTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('VaultTxRedeemCard', () => {
  const mockInfo = {
    type: 'VaultRedeem',
    humanDescription: null,
    value: '1000000',
    baseNrr: 4.02541446685791,
    fee: 0.15000000596046448,
    tokenInfo: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      logoUri: 'https://example.com/eth-logo.png',
      name: 'USD Coin',
      symbol: 'USDC',
      trusted: true,
    },
    vaultInfo: {
      address: '0x390D077f8E60ffb58805420edc635670AA4f34C3',
      name: 'Morpho Steakhouse',
      description:
        'The Steakhouse Morpho vault aims to optimize yields by lending USDC against blue chip crypto and real world asset (RWA) collateral markets. Performance Fees: 15%.',
      dashboardUri: 'https://app.morpho.org/base/vault/0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183/steakhouse-usdc',
      logoUri: 'https://example.com/eth-logo.png',
    },
    currentReward: '9978',
    additionalRewardsNrr: 1.2086049318313599,
    additionalRewards: [
      {
        tokenInfo: {
          address: '0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842',
          decimals: 18,
          logoUri: 'https://example.com/eth-logo.png',
          name: 'Morpho Token',
          symbol: 'MORPHO',
          trusted: true,
        },
        nrr: 1.2086049318313599,
        claimable: '0',
        claimableNext: '0',
      },
    ],
  } as VaultRedeemTransactionInfo

  it('renders correctly', () => {
    const { toJSON } = render(<VaultTxRedeemCard info={mockInfo} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with given info', () => {
    const screen = render(<VaultTxRedeemCard info={mockInfo} />)

    // Check that important props are passed correctly
    expect(screen.getByText('Withdraw')).toBeTruthy()
    expect(screen.getByText('1 USDC')).toBeTruthy()
    expect(screen.getByTestId('logo-image')).toBeTruthy()
  })
})
