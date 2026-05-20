import { render, screen } from '@/tests/test-utils'
import AccountsNavigation from './index'
import * as useChainsModule from '@/hooks/useChains'

describe('AccountsNavigation', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Tabs follow DISABLE_SPACES_LOGIN: shown only in legacy mode (flag true), hidden by default
  // so /welcome/spaces is the single surfaced entry while the new flow is on.

  it('shows both Accounts and Spaces tabs in legacy mode (DISABLE_SPACES_LOGIN flag is true)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(true)
    render(<AccountsNavigation />)
    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('Spaces')).toBeInTheDocument()
  })

  it('renders nothing while chain config is loading (new flow assumed)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(undefined)
    const { container } = render(<AccountsNavigation />)
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument()
    expect(screen.queryByText('Spaces')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when DISABLE_SPACES_LOGIN flag is unset (new flow ON)', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(false)
    const { container } = render(<AccountsNavigation />)
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument()
    expect(screen.queryByText('Spaces')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })
})
