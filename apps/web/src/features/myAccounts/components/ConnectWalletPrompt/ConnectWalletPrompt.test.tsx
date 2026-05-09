import { render, screen, fireEvent } from '@testing-library/react'
import ConnectWalletPrompt from './index'

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

describe('ConnectWalletPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the connect wallet prompt', () => {
    render(<ConnectWalletPrompt />)

    expect(screen.getByTestId('connect-wallet-prompt')).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet')).toBeInTheDocument()
    expect(screen.getByText(/view and manage your Safe Accounts/i)).toBeInTheDocument()
  })

  it('should call connectWallet when button is clicked', () => {
    render(<ConnectWalletPrompt />)

    fireEvent.click(screen.getByTestId('connect-wallet-button'))

    expect(mockConnectWallet).toHaveBeenCalled()
  })
})
