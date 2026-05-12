import { render, screen } from '@/tests/test-utils'
import AccountsNavigation from './index'
import * as useChainsModule from '@/hooks/useChains'

describe('AccountsNavigation', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows both Accounts and Spaces tabs when CLASSIC_UI_ENABLED is enabled', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(true)
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

  it('renders nothing when CLASSIC_UI_ENABLED is explicitly disabled', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(false)
    const { container } = render(<AccountsNavigation />)
    // With classic killed, only Spaces remains — the single-tab widget is hidden.
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument()
    expect(screen.queryByText('Spaces')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })
})
