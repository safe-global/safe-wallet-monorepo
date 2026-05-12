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

  it('hides the Accounts tab when CLASSIC_UI_ENABLED is explicitly disabled', () => {
    jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockReturnValue(false)
    render(<AccountsNavigation />)
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument()
    expect(screen.getByText('Spaces')).toBeInTheDocument()
  })
})
