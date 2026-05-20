import { render, screen, fireEvent } from '@testing-library/react'
import ConnectWalletPrompt from '../ConnectWalletPrompt'

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

describe('ConnectWalletPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the default message and button', () => {
    render(<ConnectWalletPrompt />)

    expect(screen.getByText('Connect your wallet to access all your Safes')).toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-prompt-button')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
  })

  it('renders a custom message and button label', () => {
    render(<ConnectWalletPrompt message="Custom message" buttonLabel="Custom CTA" />)

    expect(screen.getByText('Custom message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom CTA' })).toBeInTheDocument()
  })

  it('uses a custom testId when provided', () => {
    render(<ConnectWalletPrompt testId="custom-test-id" />)

    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
    expect(screen.queryByTestId('connect-wallet-prompt-button')).not.toBeInTheDocument()
  })

  it('calls connectWallet when the button is clicked', () => {
    render(<ConnectWalletPrompt />)

    fireEvent.click(screen.getByTestId('connect-wallet-prompt-button'))

    expect(mockConnectWallet).toHaveBeenCalledTimes(1)
  })
})
