import { defaultSecurityContextValues } from '@safe-global/utils/components/tx/security/shared/utils'
import { type ReactElement } from 'react'
import * as hooks from '@/components/tx/SignOrExecuteForm/hooks'
import * as useValidateTxData from '@/hooks/useValidateTxData'
import { SignForm } from '../SignForm'
import { render as renderTestUtils } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { fireEvent, waitFor } from '@testing-library/react'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'

// We assume that CheckWallet always returns true
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

const render = (ui: ReactElement, txFlowContext: Partial<TxFlowContextType> = {}) => {
  return renderTestUtils(
    <TxFlowContext.Provider value={{ ...initialContext, ...txFlowContext }}>{ui}</TxFlowContext.Provider>,
  )
}

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
      { id: 'sign', label: 'Sign' },
      { id: 'execute', label: 'Execute' },
    ],
    onChange: jest.fn(),
    slotId: 'sign',
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

  describe('shows a disabled submit button if', () => {
    it('there is no safeTx', () => {
      const { getByText } = render(<SignForm {...defaultProps} safeTx={undefined} />)

      const button = getByText('Sign')

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('is submit loading', () => {
      const { getByTestId } = render(<SignForm {...defaultProps} />, { isSubmitLoading: true })

      const button = getByTestId('combo-submit-sign')

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('passed via props', () => {
      const { getByText } = render(<SignForm {...defaultProps} safeTx={safeTransaction} disableSubmit />)

      const button = getByText('Sign')

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('connected wallet is not an owner', () => {
      const { getByText } = render(<SignForm {...defaultProps} safeTx={safeTransaction} isOwner={false} />)

      const button = getByText('Sign')

      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('there is a high or critical risk and user has not confirmed it', () => {
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
