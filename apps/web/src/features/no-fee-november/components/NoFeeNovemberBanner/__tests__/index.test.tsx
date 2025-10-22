import { render, screen, fireEvent } from '@/tests/test-utils'
import NoFeeNovemberBanner from '@/features/no-fee-november/components/NoFeeNovemberBanner'
import * as useNoFeeNovemberEligibilityHook from '@/features/no-fee-november/hooks/useNoFeeNovemberEligibility'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'

// Mock the eligibility hook
jest.mock('@/features/no-fee-november/hooks/useNoFeeNovemberEligibility')

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { safe: '0x123' },
  }),
}))

// Mock the TxModalContext
const mockSetTxFlow = jest.fn()
const MockTxModalProvider = ({ children }: { children: React.ReactNode }) => (
  <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
)

describe('NoFeeNovemberBanner', () => {
  const mockOnDismiss = jest.fn()
  const mockUseNoFeeNovemberEligibility = useNoFeeNovemberEligibilityHook.default as jest.MockedFunction<
    typeof useNoFeeNovemberEligibilityHook.default
  >

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state with skeleton', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: undefined,
      isLoading: true,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    expect(screen.getByLabelText('close')).toBeInTheDocument()
  })

  it('should render eligible state with new transaction button', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: true,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    expect(screen.getByText('Enjoy No Fee November')).toBeInTheDocument()
    expect(screen.getByText('SAFE holders enjoy gasless transactions on Mainnet this November.')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByText('New transaction')).toBeInTheDocument()
    expect(screen.getByLabelText('close')).toBeInTheDocument()
  })

  it('should render not eligible state with get SAFE button', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: false,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    expect(screen.getByText('Enjoy No Fee November')).toBeInTheDocument()
    expect(screen.getByText('SAFE holders enjoy gasless transactions on Mainnet this November.')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByText("You don't hold any SAFE yet — get some to enjoy No Fee November.")).toBeInTheDocument()
    expect(screen.getByText('Get SAFE token')).toBeInTheDocument()
    expect(screen.getByLabelText('close')).toBeInTheDocument()
  })

  it('should render error state with error message', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: undefined,
      isLoading: false,
      error: new Error('Failed to check eligibility'),
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    expect(screen.getByText('Enjoy No Fee November')).toBeInTheDocument()
    expect(screen.getByText('SAFE holders enjoy gasless transactions on Mainnet this November.')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByText('Unable to check eligibility')).toBeInTheDocument()
    expect(screen.getByLabelText('close')).toBeInTheDocument()
  })

  it('should call onDismiss when close button is clicked', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: true,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const closeButton = screen.getByLabelText('close')
    fireEvent.click(closeButton)

    expect(mockOnDismiss).toHaveBeenCalledWith(true)
  })

  it('should call setTxFlow when new transaction button is clicked', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: true,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const newTransactionButton = screen.getByText('New transaction')
    fireEvent.click(newTransactionButton)

    expect(mockSetTxFlow).toHaveBeenCalledWith(<NewTxFlow />, undefined, false)
  })

  it('should have correct link for learn more', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: true,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const learnMoreLink = screen.getByText('Learn more')
    expect(learnMoreLink.closest('a')).toHaveAttribute('href', 'https://help.safe.global/en/')
  })

  it('should have correct link for get SAFE token button', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: false,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const getSafeButton = screen.getByText('Get SAFE token')
    const link = getSafeButton.closest('a')
    expect(link).toHaveAttribute('href', '/swap?safe=0x123')
  })

  it('should pass correct eligibility state to onDismiss', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: false,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const closeButton = screen.getByLabelText('close')
    fireEvent.click(closeButton)

    expect(mockOnDismiss).toHaveBeenCalledWith(false)
  })

  it('should handle undefined eligibility state', () => {
    mockUseNoFeeNovemberEligibility.mockReturnValue({
      isEligible: undefined,
      isLoading: false,
      error: undefined,
    })

    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const closeButton = screen.getByLabelText('close')
    fireEvent.click(closeButton)

    expect(mockOnDismiss).toHaveBeenCalledWith(undefined)
  })
})
