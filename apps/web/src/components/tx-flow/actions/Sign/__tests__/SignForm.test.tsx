import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import { type ReactElement } from 'react'
import * as hooks from '@/components/tx/SignOrExecuteForm/hooks'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import { SignForm } from '../SignForm'
import { render } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/safe-core-sdk-types'
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
    options: [
      { id: 'item1', label: 'Item 1' },
      { id: 'item2', label: 'Item 2' },
    ],
    onChange: jest.fn(),
    slotId: 'item1',
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
})
