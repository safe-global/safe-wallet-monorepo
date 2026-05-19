import { render, screen } from '@/tests/test-utils'
import AccountsNavigation from './index'
import * as useChainsModule from '@/hooks/useChains'

describe('AccountsNavigation', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // DISABLE_CLASSIC_UI is a kill switch: chain flag unset/false → classic ON; true → OFF.

  it('shows both Accounts and Spaces tabs when DISABLE_CLASSIC_UI flag is unset (classic ON)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(false)
    render(<AccountsNavigation />)
    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('Spaces')).toBeInTheDocument()
  })

  it('shows both tabs while chain config is loading (optimistic)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(undefined)
    render(<AccountsNavigation />)
    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('Spaces')).toBeInTheDocument()
  })

  it('renders nothing when DISABLE_CLASSIC_UI flag is true (classic killed)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(true)
    const { container } = render(<AccountsNavigation />)
    // With classic killed, only Spaces remains — the single-tab widget is hidden.
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument()
    expect(screen.queryByText('Spaces')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })
})
