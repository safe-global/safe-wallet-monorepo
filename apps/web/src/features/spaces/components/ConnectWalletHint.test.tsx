import { fireEvent, render, screen } from '@/tests/test-utils'
import ConnectWalletHint from './ConnectWalletHint'

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

describe('ConnectWalletHint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the hint copy and a Connect button with the given test id', () => {
    render(<ConnectWalletHint testId="my-connect-button" />)

    expect(screen.getByText('Connect a wallet to discover accounts you own or sign for')).toBeInTheDocument()
    expect(screen.getByTestId('my-connect-button')).toBeInTheDocument()
  })

  it('triggers wallet connection when the button is clicked', () => {
    render(<ConnectWalletHint testId="my-connect-button" />)

    fireEvent.click(screen.getByTestId('my-connect-button'))
    expect(mockConnectWallet).toHaveBeenCalled()
  })
})
