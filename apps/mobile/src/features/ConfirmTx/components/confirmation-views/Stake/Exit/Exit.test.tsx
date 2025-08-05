import React from 'react'
import { render } from '@/src/tests/test-utils'
import { StakingExit } from './Exit'
import {
  NativeStakingWithdrawTransactionInfo,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockExitTxInfo: NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw',
  humanDescription: 'Exit staked tokens',
  value: '32000000000000000000', // 32 ETH in wei
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
  txInfo: mockExitTxInfo,
  executionInfo: mockExecutionInfo,
  txId: 'test-tx-id',
}

describe('StakingExit', () => {
  it('renders correctly with exit information', () => {
    const { getByText, getAllByText } = render(<StakingExit {...mockProps} />)

    expect(getAllByText(/32.*ETH/)).toHaveLength(2) // TokenAmount in header and receive row
    expect(getByText('Receive')).toBeTruthy() // Receive label
  })

  it('matches snapshot', () => {
    const component = render(<StakingExit {...mockProps} />)
    expect(component).toMatchSnapshot()
  })
})
