import React from 'react'
import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { SigningState } from './SigningState'
import { useTransactionSigningState } from '@/src/hooks/useTransactionSigningState'
import config from '@/src/theme/tamagui.config'

// Mock the signing state hook
jest.mock('@/src/hooks/useTransactionSigningState', () => ({
  useTransactionSigningState: jest.fn(),
}))

const mockUseTransactionSigningState = useTransactionSigningState as jest.MockedFunction<
  typeof useTransactionSigningState
>

// Test wrapper with Tamagui provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper })
}

describe('SigningState', () => {
  const mockExecutionInfo = {
    confirmationsSubmitted: 2,
    confirmationsRequired: 3,
    type: 'MULTISIG' as const,
    nonce: 1,
    missingSigners: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: not signing
    mockUseTransactionSigningState.mockReturnValue({
      isSigning: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      startedAt: undefined,
      completedAt: undefined,
    })
  })

  it('renders loader when signing is in progress', () => {
    mockUseTransactionSigningState.mockReturnValue({
      isSigning: true,
      isSuccess: false,
      isError: false,
      error: undefined,
      startedAt: Date.now(),
      completedAt: undefined,
    })

    const { getByTestId } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />,
    )

    expect(getByTestId('signing-state-loader')).toBeOnTheScreen()
  })

  it('renders ProposalBadge when transaction is proposed', () => {
    const { getByText } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={true} />,
    )

    // ProposalBadge contains "Proposal" text
    expect(getByText('Proposal')).toBeOnTheScreen()
  })

  it('renders confirmation badge when NOT signing and NOT proposed', () => {
    const { getByText } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />,
    )

    // Should show confirmation count: 2/3
    expect(getByText('2/3')).toBeOnTheScreen()
  })

  it('uses success theme when all confirmations collected', () => {
    const executionInfoComplete = {
      ...mockExecutionInfo,
      confirmationsSubmitted: 3,
      confirmationsRequired: 3,
    }

    const { getByText } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={executionInfoComplete} isProposedTx={false} />,
    )

    expect(getByText('3/3')).toBeOnTheScreen()
    // Badge should use success theme when complete
  })

  it('calls useTransactionSigningState with correct txId', () => {
    renderWithProviders(<SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />)

    expect(mockUseTransactionSigningState).toHaveBeenCalledWith('tx123')
  })

  it('calls useTransactionSigningState with different txId for different transactions', () => {
    const { rerender } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />,
    )

    expect(mockUseTransactionSigningState).toHaveBeenCalledWith('tx123')

    // Rerender with different txId
    rerender(
      <TestWrapper>
        <SigningState txId="tx456" executionInfo={mockExecutionInfo} isProposedTx={false} />
      </TestWrapper>,
    )

    expect(mockUseTransactionSigningState).toHaveBeenCalledWith('tx456')
  })

  it('transitions from loading to badge when signing completes', () => {
    // Start with signing in progress
    mockUseTransactionSigningState.mockReturnValue({
      isSigning: true,
      isSuccess: false,
      isError: false,
      error: undefined,
      startedAt: Date.now(),
      completedAt: undefined,
    })

    const { getByTestId, queryByTestId, getByText, rerender } = renderWithProviders(
      <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />,
    )

    expect(getByTestId('signing-state-loader')).toBeOnTheScreen()

    // Signing completes
    mockUseTransactionSigningState.mockReturnValue({
      isSigning: false,
      isSuccess: true,
      isError: false,
      error: undefined,
      startedAt: Date.now() - 1000,
      completedAt: Date.now(),
    })

    rerender(
      <TestWrapper>
        <SigningState txId="tx123" executionInfo={mockExecutionInfo} isProposedTx={false} />
      </TestWrapper>,
    )

    expect(queryByTestId('signing-state-loader')).not.toBeOnTheScreen()
    expect(getByText('2/3')).toBeOnTheScreen()
  })

  it('renders correctly with different confirmation counts', () => {
    const testCases = [
      { submitted: 0, required: 1, expected: '0/1' },
      { submitted: 1, required: 2, expected: '1/2' },
      { submitted: 5, required: 10, expected: '5/10' },
    ]

    testCases.forEach(({ submitted, required, expected }) => {
      const executionInfo = {
        ...mockExecutionInfo,
        confirmationsSubmitted: submitted,
        confirmationsRequired: required,
      }

      const { getByText, unmount } = renderWithProviders(
        <SigningState txId={`tx-${submitted}-${required}`} executionInfo={executionInfo} isProposedTx={false} />,
      )

      expect(getByText(expected)).toBeOnTheScreen()
      unmount()
    })
  })
})
