import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WcHints from '.'
import { trackEvent } from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('WcHints component tests', () => {
  const CONNECT_TITLE = 'How do I connect to a dApp?'
  const INTERACT_TITLE = 'How do I interact with a dApp?'
  const CONNECT_STEP = 'Open a WalletConnect supported dApp'
  const INTERACT_STEP = 'Connect a dApp by following the above steps'
  const CONNECT_WALLET = 'Connect a wallet'
  const ENSURE_CHAIN = 'Ensure the dApp is connected to the same chain as your Safe Account'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Verify both help accordions are rendered collapsed by default', () => {
    render(<WcHints />)

    expect(screen.getByText(CONNECT_TITLE)).toBeVisible()
    expect(screen.getByText(INTERACT_TITLE)).toBeVisible()

    expect(screen.queryByText(CONNECT_STEP)).not.toBeVisible()
    expect(screen.queryByText(INTERACT_STEP)).not.toBeVisible()
  })

  it('Verify connection accordion can be expanded', () => {
    render(<WcHints />)

    fireEvent.click(screen.getByText(CONNECT_TITLE))

    expect(screen.getByText(CONNECT_STEP)).toBeVisible()
    expect(screen.getByText(CONNECT_WALLET)).toBeVisible()

    expect(trackEvent).toHaveBeenCalledWith({
      category: 'walletconnect',
      action: 'WC expand hints',
    })
  })

  it('Verify interaction accordion can be expanded', () => {
    render(<WcHints />)

    fireEvent.click(screen.getByText(INTERACT_TITLE))

    expect(screen.getByText(INTERACT_STEP)).toBeVisible()
    expect(screen.getByText(ENSURE_CHAIN)).toBeVisible()

    expect(trackEvent).toHaveBeenCalledWith({
      category: 'walletconnect',
      action: 'WC expand hints',
    })
  })

  it('Verify expanded accordion can be collapsed', async () => {
    render(<WcHints />)

    const connectionTitle = screen.getByText(CONNECT_TITLE)

    fireEvent.click(connectionTitle)
    expect(screen.getByText(CONNECT_STEP)).toBeVisible()

    fireEvent.click(connectionTitle)
    await waitFor(() => {
      expect(screen.queryByText(CONNECT_STEP)).not.toBeVisible()
    })
  })

  it('Verify previously opened accordion is closed when opening a new one', async () => {
    render(<WcHints />)

    fireEvent.click(screen.getByText(CONNECT_TITLE))
    expect(screen.getByText(CONNECT_STEP)).toBeVisible()

    fireEvent.click(screen.getByText(INTERACT_TITLE))

    await waitFor(() => {
      expect(screen.queryByText(CONNECT_STEP)).not.toBeVisible()
    })
    expect(screen.getByText(INTERACT_STEP)).toBeVisible()
  })
})
