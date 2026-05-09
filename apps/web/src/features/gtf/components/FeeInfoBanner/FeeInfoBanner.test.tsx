import { render, screen, fireEvent } from '@testing-library/react'
import FeeInfoBanner from './index'

const mockSetDismissed = jest.fn()
let mockDismissed = false

jest.mock('@/services/local-storage/useLocalStorage', () => jest.fn(() => [mockDismissed, mockSetDismissed]))

jest.mock('@/hooks/useChainId', () => jest.fn(() => '1'))

describe('FeeInfoBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDismissed = false
  })

  it('renders the banner when not dismissed', () => {
    render(<FeeInfoBanner />)

    expect(screen.getByText('Soon, fees will be paid from your Safe balance.')).toBeInTheDocument()
    expect(screen.getByText('No need to fund signing wallets')).toBeInTheDocument()
    expect(screen.getByText('Pay fees in any supported token')).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
  })

  it('does not render when dismissed', () => {
    mockDismissed = true

    const { container } = render(<FeeInfoBanner />)

    expect(container.innerHTML).toBe('')
  })

  it('calls setDismissed when close button is clicked', () => {
    render(<FeeInfoBanner />)

    fireEvent.click(screen.getByLabelText('close'))

    expect(mockSetDismissed).toHaveBeenCalledWith(true)
  })
})
