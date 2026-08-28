import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { mockConnectedWallet } from '../mocks/wallet'
import Policies from '../index'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseConnectWallet = useConnectWallet as jest.MockedFunction<typeof useConnectWallet>

const connectWallet = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockUseWallet.mockReturnValue(mockConnectedWallet('0x0000000000000000000000000000000000000A11'))
  mockUseConnectWallet.mockReturnValue(connectWallet)
})

/**
 * The page must render a title, a one-line description and a `Learn more` link to documentation,
 * with the copy exactly as designed. The description's onchain framing is deliberate even though a
 * Proposer grant is off-chain — a product decision, not an oversight.
 */
describe('Policies', () => {
  it('renders the page title', () => {
    render(<Policies />)

    expect(screen.getByRole('heading', { name: 'Policies' })).toBeInTheDocument()
  })

  it('renders the description as designed', () => {
    render(<Policies />)

    expect(
      screen.getByText(
        /Policies are rules that help you manage your Safe accounts\. Set them up once and they will run onchain, automatically\./,
      ),
    ).toBeInTheDocument()
  })

  it('links Learn more to the policies documentation', () => {
    render(<Policies />)

    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', HelpCenterArticle.POLICIES)
  })

  // Mirrors the `Learn more` link in the Proposers section of Safe settings
  // (components/settings/ProposersList) — bold, with the external-link icon.
  it('styles Learn more like the Proposers section', () => {
    render(<Policies />)

    const link = screen.getByRole('link', { name: 'Learn more' })

    expect(link.querySelector('.external-link-icon')).toBeInTheDocument()
    expect(link).toHaveClass('font-bold', 'hover:text-muted-foreground')
  })

  it('renders the policy catalogue', () => {
    render(<Policies />)

    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Proposer')).toBeInTheDocument()
    expect(screen.getByText('Account recovery')).toBeInTheDocument()
    expect(screen.getByText('Something missing?')).toBeInTheDocument()
  })

  it('renders the catalogue only, with no table, create button or search', () => {
    render(<Policies />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create policy/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  describe('wallet gate', () => {
    it('should, when no wallet is connected, still render the catalogue', () => {
      mockUseWallet.mockReturnValue(null)

      render(<Policies />)

      expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
      expect(screen.getByText('Proposer')).toBeInTheDocument()
    })

    it('should, when a wallet is connected, open the flow without opening the connect dialog', async () => {
      const onOpenFlow = jest.fn()

      render(<Policies onOpenFlow={onOpenFlow} />)
      fireEvent.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      await waitFor(() => expect(onOpenFlow).toHaveBeenCalledWith('proposer'))
      expect(connectWallet).not.toHaveBeenCalled()
    })

    it('should, when no wallet is connected, open the connect dialog instead of the flow', async () => {
      mockUseWallet.mockReturnValue(null)
      connectWallet.mockResolvedValue([])
      const onOpenFlow = jest.fn()

      render(<Policies onOpenFlow={onOpenFlow} />)
      fireEvent.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      await waitFor(() => expect(connectWallet).toHaveBeenCalled())
      expect(onOpenFlow).not.toHaveBeenCalled()
    })

    it('should, when the user connects a wallet, open the flow for the tile they clicked', async () => {
      mockUseWallet.mockReturnValue(null)
      connectWallet.mockResolvedValue([{ label: 'MetaMask' }])
      const onOpenFlow = jest.fn()

      render(<Policies onOpenFlow={onOpenFlow} />)
      fireEvent.click(screen.getByTestId('policy-catalogue-tile-proposer'))

      await waitFor(() => expect(onOpenFlow).toHaveBeenCalledWith('proposer'))
    })

    it('should, when the clicked policy type is unavailable, neither open a flow nor prompt to connect', async () => {
      mockUseWallet.mockReturnValue(null)
      const onOpenFlow = jest.fn()

      render(<Policies onOpenFlow={onOpenFlow} />)
      fireEvent.click(screen.getByTestId('policy-catalogue-tile-spending-limit'))

      await waitFor(() => expect(onOpenFlow).not.toHaveBeenCalled())
      expect(connectWallet).not.toHaveBeenCalled()
    })
  })
})
