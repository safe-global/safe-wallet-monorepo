import { defaultSecurityContextValues } from '@/components/tx/security/shared/TxSecurityContext'
import { type AsyncResult } from '@/hooks/useAsync'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { type ReactElement } from 'react'
import { ExecuteForm } from '@/components/tx/SignOrExecuteForm/ExecuteForm'
import * as useGasLimit from '@/hooks/useGasLimit'
import * as useIsValidExecution from '@/hooks/useIsValidExecution'
import * as useWalletCanRelay from '@/hooks/useWalletCanRelay'
import * as relayUtils from '@/utils/relaying'
import * as walletCanPay from '@/hooks/useWalletCanPay'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import { render } from '@/tests/test-utils'
import { fireEvent, waitFor } from '@testing-library/react'
import type { RelayCountResponse } from '@safe-global/safe-gateway-typescript-sdk'

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

describe('ExecuteForm', () => {
  const safeTransaction = createMockSafeTransaction({
    to: '0x1',
    data: '0x',
    operation: OperationType.Call,
  })

  const defaultProps = {
    onSubmit: jest.fn(),
    isOwner: true,
    txId: '0x123123',
    isExecutionLoop: false,
    relays: [undefined, undefined, false] as AsyncResult<RelayCountResponse>,
    txActions: {
      proposeTx: jest.fn(),
      signTx: jest.fn(),
      addToBatch: jest.fn(),
      executeTx: jest.fn(),
      signProposerTx: jest.fn(),
    },
    txSecurity: defaultSecurityContextValues,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useValidateTxData, 'useValidateTxData').mockReturnValue([undefined, undefined, false])
  })

  it('shows estimated fees', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText('Estimated fee')).toBeInTheDocument()
  })

  it('shows a non-owner error if the transaction still needs signatures and its not an owner', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={false} />)

    expect(
      getByText("You are currently not a signer of this Safe Account and won't be able to submit this transaction."),
    ).toBeInTheDocument()
  })

  it('does not show a non-owner error if the transaction is fully signed and its not an owner', () => {
    const { queryByText } = render(<ExecuteForm {...defaultProps} isOwner={false} onlyExecute={true} />)

    expect(
      queryByText("You are currently not a signer of this Safe Account and won't be able to submit this transaction."),
    ).not.toBeInTheDocument()
  })

  it('shows an error if the same safe tries to execute', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    expect(
      getByText('Cannot execute a transaction from the Safe Account itself, please connect a different account.'),
    ).toBeInTheDocument()
  })

  it('shows an error if the connected wallet has insufficient funds to execute and relaying is not selected', () => {
    jest.spyOn(walletCanPay, 'default').mockReturnValue(false)
    jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
    jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)

    const { getByText, queryByText, getByTestId } = render(<ExecuteForm {...defaultProps} />)

    expect(
      queryByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).not.toBeInTheDocument()

    const executeWithWalletOption = getByTestId('connected-wallet-execution-method')
    fireEvent.click(executeWithWalletOption)

    expect(
      getByText("Your connected wallet doesn't have enough funds to execute this transaction."),
    ).toBeInTheDocument()
  })

  it('shows a relaying option if relaying is enabled', () => {
    jest.spyOn(useWalletCanRelay, 'default').mockReturnValue([true, undefined, false])
    jest.spyOn(relayUtils, 'hasRemainingRelays').mockReturnValue(true)

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(getByText('Who will pay gas fees:')).toBeInTheDocument()
  })

  it('shows an execution validation error', () => {
    jest
      .spyOn(useIsValidExecution, 'default')
      .mockReturnValue({ executionValidationError: new Error('Some error'), isValidExecutionLoading: false })

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: jest.fn(),
          signProposerTx: jest.fn(),
        }}
      />,
    )

    expect(
      getByText('This transaction will most likely fail. To save gas costs, reject this transaction.'),
    ).toBeInTheDocument()
  })

  it('shows a gasLimit error', () => {
    jest
      .spyOn(useGasLimit, 'default')
      .mockReturnValue({ gasLimitError: new Error('Gas limit error'), gasLimitLoading: false })

    const { getByText } = render(<ExecuteForm {...defaultProps} />)

    expect(
      getByText('This transaction will most likely fail. To save gas costs, reject this transaction.'),
    ).toBeInTheDocument()
  })

  it('shows a submit error', async () => {
    const mockExecuteTx = jest.fn(() => {
      throw new Error('Error submitting the tx')
    })

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        onSubmit={jest.fn()}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: mockExecuteTx,
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Execute')

    fireEvent.click(button)

    await waitFor(() => {
      expect(getByText('Error submitting the transaction. Please try again.')).toBeInTheDocument()
    })
  })

  it('execute the tx when the submit button is clicked', async () => {
    const mockExecuteTx = jest.fn()

    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: jest.fn(),
          executeTx: mockExecuteTx,
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Execute')

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockExecuteTx).toHaveBeenCalled()
    })
  })

  it('shows a disabled submit button if there is no safeTx', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} safeTx={undefined} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if passed via props', () => {
    const { getByText } = render(<ExecuteForm safeTx={safeTransaction} disableSubmit {...defaultProps} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if the same safe is connected', () => {
    const { getByText } = render(<ExecuteForm {...defaultProps} isExecutionLoop={true} />)

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if there is a high or critical risk and user has not confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: false, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows an enabled submit button if there is a high or critical risk and user has confirmed it', () => {
    const { getByText } = render(
      <ExecuteForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultProps.txSecurity, isRiskConfirmed: true, needsRiskConfirmation: true }}
      />,
    )

    const button = getByText('Execute')

    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })
})
