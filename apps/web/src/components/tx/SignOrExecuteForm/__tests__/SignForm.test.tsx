import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import { type ReactElement } from 'react'
import * as hooks from '@/components/tx/SignOrExecuteForm/hooks'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import { SignForm } from '@/components/tx/SignOrExecuteForm/SignForm'
import { render } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { fireEvent, waitFor } from '@testing-library/react'

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

describe('SignForm', () => {
  const safeTransaction = createMockSafeTransaction({
    to: '0x1',
    data: '0x',
    operation: OperationType.Call,
  })

  const defaultProps = {
    onSubmit: jest.fn(),
    txId: '0x01231',
    isOwner: true,
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

  it('displays a warning if connected wallet already signed the tx', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(true)

    const { getByText } = render(<SignForm {...defaultProps} />)

    expect(getByText('You have already signed this transaction.')).toBeInTheDocument()
  })

  it('does not display a warning if connected wallet has not signed the tx yet', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)

    const { queryByText } = render(<SignForm {...defaultProps} />)

    expect(queryByText('You have already signed this transaction.')).not.toBeInTheDocument()
  })

  it('shows a non-owner error', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)

    const { queryByText } = render(<SignForm {...defaultProps} isOwner={false} />)

    expect(
      queryByText(
        'You are currently not a signer of this Safe Account and won&apos;t be able to submit this transaction.',
      ),
    ).not.toBeInTheDocument()
  })

  it('shows a submit error', async () => {
    const mockSignTx = jest.fn(() => {
      throw new Error('Error signing the tx')
    })

    const { getByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{
          proposeTx: jest.fn(),
          signTx: mockSignTx,
          addToBatch: jest.fn(),
          signProposerTx: jest.fn(),
          executeTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Sign')

    fireEvent.click(button)

    await waitFor(() => {
      expect(getByText('Error submitting the transaction. Please try again.')).toBeInTheDocument()
    })
  })

  it('signs a transaction', async () => {
    const mockSignTx = jest.fn()

    const { getByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        txActions={{
          proposeTx: jest.fn(),
          signTx: mockSignTx,
          addToBatch: jest.fn(),
          executeTx: jest.fn(),
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const button = getByText('Sign')

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSignTx).toHaveBeenCalled()
    })
  })

  it('shows a batch button on tx creation', () => {
    const { getByText } = render(<SignForm {...defaultProps} isCreation />)

    expect(getByText('Add to batch')).toBeInTheDocument()
  })

  it('does not show a batch button when signing a batch', () => {
    const { queryByText } = render(<SignForm {...defaultProps} isCreation isBatch />)

    expect(queryByText('Add to batch')).not.toBeInTheDocument()
  })

  it('disables the batch button if tx is not batchable', () => {
    const { getByText } = render(<SignForm {...defaultProps} isCreation isBatchable={false} />)

    const batchButton = getByText('Add to batch')

    expect(batchButton).toBeInTheDocument()
    expect(batchButton).toBeDisabled()
  })

  it('submits a batch when the batch button is clicked', async () => {
    const mockAddToBatch = jest.fn()

    const { getByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        isBatchable
        isCreation
        txActions={{
          proposeTx: jest.fn(),
          signTx: jest.fn(),
          addToBatch: mockAddToBatch,
          executeTx: jest.fn(),
          signProposerTx: jest.fn(),
        }}
      />,
    )

    const batchButton = getByText('Add to batch')

    fireEvent.click(batchButton)

    await waitFor(() => {
      expect(mockAddToBatch).toHaveBeenCalled()
    })
  })

  it('shows a disabled submit button if there is no safeTx', () => {
    const { getByText } = render(<SignForm {...defaultProps} safeTx={undefined} />)

    const button = getByText('Sign')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if passed via props', () => {
    const { getByText } = render(<SignForm {...defaultProps} safeTx={safeTransaction} disableSubmit />)

    const button = getByText('Sign')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if not an owner', () => {
    const { getByText } = render(<SignForm {...defaultProps} safeTx={safeTransaction} isOwner={false} />)

    const button = getByText('Sign')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows a disabled submit button if there is a high or critical risk and user has not confirmed it', () => {
    const { getByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultSecurityContextValues, needsRiskConfirmation: true, isRiskConfirmed: false }}
      />,
    )

    const button = getByText('Sign')

    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows an enabled submit button if there is a high or critical risk and user has confirmed it', () => {
    const { getByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultSecurityContextValues, needsRiskConfirmation: true, isRiskConfirmed: true }}
      />,
    )

    const button = getByText('Sign')

    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('Hides the Add to batch button if there is an origin', () => {
    const { queryByText } = render(
      <SignForm
        {...defaultProps}
        safeTx={safeTransaction}
        txSecurity={{ ...defaultSecurityContextValues, needsRiskConfirmation: true, isRiskConfirmed: true }}
        origin="MockOrigin"
      />,
    )

    const button = queryByText('Add to batch')

    expect(button).not.toBeInTheDocument()
  })

  it('Shows the Add to batch button if there is no origin and it is a creation', () => {
    const { getByText } = render(
      <SignForm {...defaultProps} safeTx={safeTransaction} origin={undefined} isCreation={true} />,
    )

    const button = getByText('Add to batch')

    expect(button).toBeInTheDocument()
  })
})
