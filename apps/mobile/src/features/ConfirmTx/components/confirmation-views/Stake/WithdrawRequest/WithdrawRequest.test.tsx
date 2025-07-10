import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingWithdrawRequest } from './WithdrawRequest'
import {
  NativeStakingValidatorsExitTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockWithdrawRequestTxInfo: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit',
  humanDescription: 'Request withdrawal of staked tokens',
  status: 'ACTIVE',
  estimatedExitTime: 30 * 86400000, // 30 days in milliseconds
  estimatedWithdrawalTime: 2 * 86400000, // 2 days in milliseconds
  value: '32000000000000000000', // 32 ETH in wei
  numValidators: 1,
  tokenInfo: {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18,
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    name: 'Ethereum',
    symbol: 'ETH',
    trusted: true,
  },
  validators: ['0x123...abc'],
}

const mockExecutionInfo: MultisigExecutionDetails = {
  type: 'MULTISIG',
  submittedAt: 1234567890,
  nonce: 1,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: '0x0000000000000000000000000000000000000000',
  refundReceiver: {
    value: '0x0000000000000000000000000000000000000000',
  },
  safeTxHash: '0x123',
  signers: [],
  confirmationsRequired: 2,
  confirmations: [],
  rejectors: [],
  trusted: true,
}

const mockProps = {
  txInfo: mockWithdrawRequestTxInfo,
  executionInfo: mockExecutionInfo,
  txId: 'test-tx-id',
}

describe('StakingWithdrawRequest', () => {
  it('renders correctly with withdraw request information', () => {
    const { getByText, getAllByText } = render(<StakingWithdrawRequest {...mockProps} />)

    expect(getAllByText(/32.*ETH/)).toHaveLength(2) // TokenAmount in header and receive row
    expect(getByText('Exit')).toBeTruthy() // Exit label
    expect(getByText('1 Validator')).toBeTruthy() // Validator count
    expect(getAllByText('Receive')).toHaveLength(2) // Receive label (header and table)
    expect(getByText('Withdraw in')).toBeTruthy() // Withdraw in label
    expect(getByText(/Up to/)).toBeTruthy() // Withdraw timing
    expect(getByText(/withdrawal request/)).toBeTruthy() // Warning message
    expect(getByText(/Dedicated Staking for ETH/)).toBeTruthy() // Description
  })

  it('renders multiple validators correctly', () => {
    const multiValidatorProps = {
      ...mockProps,
      txInfo: {
        ...mockWithdrawRequestTxInfo,
        numValidators: 3,
      },
    }

    const { getByText } = render(<StakingWithdrawRequest {...multiValidatorProps} />)

    expect(getByText('Exit')).toBeTruthy()
    expect(getByText('3 Validators')).toBeTruthy() // Multiple validators with plural form
  })

  it('matches snapshot', () => {
    const component = render(<StakingWithdrawRequest {...mockProps} />)
    expect(component).toMatchSnapshot()
  })
})
