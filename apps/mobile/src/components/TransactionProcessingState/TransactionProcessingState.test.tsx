import { render } from '@/src/tests/test-utils'
import { TransactionProcessingState } from './TransactionProcessingState'
import { useTransactionProcessingState } from '@/src/hooks/useTransactionProcessingState'
import type { MultisigExecutionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

jest.mock('@/src/hooks/useTransactionProcessingState')

const mockUseTransactionProcessingState = useTransactionProcessingState as jest.MockedFunction<
  typeof useTransactionProcessingState
>

describe('TransactionProcessingState', () => {
  const defaultExecutionInfo: MultisigExecutionInfo = {
    type: 'MULTISIG',
    nonce: 1,
    confirmationsRequired: 2,
    confirmationsSubmitted: 1,
    missingSigners: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loader when transaction is being signed', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: true,
      isSigning: true,
      isExecuting: false,
      isPendingOnChain: false,
    })

    const { getByTestId } = render(
      <TransactionProcessingState txId="tx123" executionInfo={defaultExecutionInfo} isProposedTx={false} />,
    )

    expect(getByTestId('transaction-processing-state-loader')).toBeTruthy()
  })

  it('shows loader when transaction is being executed', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: true,
      isSigning: false,
      isExecuting: true,
      isPendingOnChain: false,
    })

    const { getByTestId } = render(
      <TransactionProcessingState txId="tx456" executionInfo={defaultExecutionInfo} isProposedTx={false} />,
    )

    expect(getByTestId('transaction-processing-state-loader')).toBeTruthy()
  })

  it('shows loader when transaction is pending on-chain', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: true,
      isSigning: false,
      isExecuting: false,
      isPendingOnChain: true,
    })

    const { getByTestId } = render(
      <TransactionProcessingState txId="tx789" executionInfo={defaultExecutionInfo} isProposedTx={false} />,
    )

    expect(getByTestId('transaction-processing-state-loader')).toBeTruthy()
  })

  it('shows proposal badge when transaction is proposed and not processing', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: false,
      isSigning: false,
      isExecuting: false,
      isPendingOnChain: false,
    })

    const { getByText } = render(
      <TransactionProcessingState txId="tx123" executionInfo={defaultExecutionInfo} isProposedTx={true} />,
    )

    expect(getByText('Proposal')).toBeTruthy()
  })

  it('shows confirmation badge with signer count when not processing and not proposed', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: false,
      isSigning: false,
      isExecuting: false,
      isPendingOnChain: false,
    })

    const executionInfo: MultisigExecutionInfo = {
      type: 'MULTISIG',
      nonce: 1,
      confirmationsRequired: 3,
      confirmationsSubmitted: 2,
      missingSigners: [],
    }

    const { getByText } = render(
      <TransactionProcessingState txId="tx123" executionInfo={executionInfo} isProposedTx={false} />,
    )

    expect(getByText('2/3')).toBeTruthy()
  })

  it('shows loader priority over proposal badge when processing', () => {
    mockUseTransactionProcessingState.mockReturnValue({
      isProcessing: true,
      isSigning: true,
      isExecuting: false,
      isPendingOnChain: false,
    })

    const { getByTestId, queryByText } = render(
      <TransactionProcessingState txId="tx123" executionInfo={defaultExecutionInfo} isProposedTx={true} />,
    )

    expect(getByTestId('transaction-processing-state-loader')).toBeTruthy()
    expect(queryByText('Proposal')).toBeNull()
  })
})
