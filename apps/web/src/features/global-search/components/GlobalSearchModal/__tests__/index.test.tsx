import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { GlobalSearchModal } from '../index'
import type { RootState } from '@/store'

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => ({ allSafes: [], isLoading: false }),
  useCurrentSpaceId: () => null,
}))

jest.mock('@/hooks/safes', () => ({
  useOwnedSafesGrouped: () => ({ allMultiChainSafes: [], allSingleSafes: [] }),
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

    expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('renders the search input when open', () => {
    renderWithOpenSearch()

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
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

    const input = screen.getByRole('textbox', { name: 'Search' })
    await user.type(input, 'test query')

    expect(input).toHaveValue('test query')
  })
})
