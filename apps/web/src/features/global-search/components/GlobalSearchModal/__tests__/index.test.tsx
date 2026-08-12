import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { GlobalSearchModal } from '../index'
import type { RootState } from '@/store'
import { mockWallet } from '@/tests/mocks/hooks'

jest.mock('@/hooks/wallets/useWallet')

const mockUseIsSwapFeatureEnabled = jest.fn().mockReturnValue(true)
jest.mock('@/features/swap', () => ({
  useIsSwapFeatureEnabled: () => mockUseIsSwapFeatureEnabled(),
}))

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => ({ allSafes: [], isLoading: false }),
  useCurrentSpaceId: () => null,
  useIsQualifiedSafe: () => false,
}))

jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: () => ({ allMultiChainSafes: [], allSingleSafes: [] }),
  isMultiChainSafeItem: () => false,
  flattenSafeItems: (items: unknown[]) => items,
}))

const renderWithOpenSearch = () => {
  const initialReduxState: Partial<RootState> = {
    globalSearch: { open: true },
  }
  return render(<GlobalSearchModal />, { initialReduxState })
}

describe('GlobalSearchModal', () => {
  it('does not render content when closed', () => {
    render(<GlobalSearchModal />)

    expect(screen.queryByRole('searchbox', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('renders the search input when open', () => {
    renderWithOpenSearch()

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('renders the navigate to section with page links', () => {
    renderWithOpenSearch()

    expect(screen.getByText('Navigate to')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Transaction builder')).toBeInTheDocument()
  })

  it('allows typing in the search input', async () => {
    const user = userEvent.setup()
    renderWithOpenSearch()

    const input = screen.getByRole('searchbox', { name: 'Search' })
    await user.type(input, 'test query')

    expect(input).toHaveValue('test query')
  })

  it('disables Send button when wallet is not connected', () => {
    mockWallet(null)
    renderWithOpenSearch()

    expect(screen.getByText('Send').closest('button')).toBeDisabled()
    expect(screen.getByText('Swap').closest('button')).not.toBeDisabled()
    expect(screen.getByText('Transaction builder').closest('button')).not.toBeDisabled()
  })

  it('enables Send button when wallet is connected', () => {
    mockWallet()
    renderWithOpenSearch()

    expect(screen.getByText('Send').closest('button')).not.toBeDisabled()
  })

  it('disables Swap button when swap feature is not enabled on the current chain', () => {
    mockUseIsSwapFeatureEnabled.mockReturnValue(false)
    renderWithOpenSearch()

    expect(screen.getByText('Swap').closest('button')).toBeDisabled()
  })

  it('enables Swap button when swap feature is enabled on the current chain', () => {
    mockUseIsSwapFeatureEnabled.mockReturnValue(true)
    renderWithOpenSearch()

    expect(screen.getByText('Swap').closest('button')).not.toBeDisabled()
  })
})
