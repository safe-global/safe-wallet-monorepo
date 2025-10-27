import { render, screen, fireEvent } from '@/tests/test-utils'
import NoFeeNovemberBanner from '@/features/no-fee-november/components/NoFeeNovemberBanner'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'

// Mock CheckWallet to always return isOk: true for tests
jest.mock('@/components/common/CheckWallet', () => {
  return function MockCheckWallet({ children }: { children: (isOk: boolean) => React.ReactNode }) {
    return children(true)
  }
})

// Mock the TxModalContext
const mockSetTxFlow = jest.fn()
const MockTxModalProvider = ({ children }: { children: React.ReactNode }) => (
  <TxModalContext.Provider value={{ setTxFlow: mockSetTxFlow } as any}>{children}</TxModalContext.Provider>
)

describe('NoFeeNovemberBanner', () => {
  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render banner with correct content', () => {
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

  it('should call onDismiss when close button is clicked', () => {
    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const closeButton = screen.getByLabelText('close')
    fireEvent.click(closeButton)

    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('should call setTxFlow when new transaction button is clicked', () => {
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
    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const learnMoreLink = screen.getByText('Learn more')
    expect(learnMoreLink.closest('a')).toHaveAttribute('href', 'https://help.safe.global/en/')
  })

  it('should render banner image with correct attributes', () => {
    render(
      <MockTxModalProvider>
        <NoFeeNovemberBanner onDismiss={mockOnDismiss} />
      </MockTxModalProvider>,
    )

    const bannerImage = screen.getByAltText('No Fee November Cards')
    expect(bannerImage).toBeInTheDocument()
    expect(bannerImage).toHaveAttribute('src', '/images/common/no-fee-november/Cards.svg')
    expect(bannerImage).toHaveAttribute('width', '76')
    expect(bannerImage).toHaveAttribute('height', '76')
  })
})
