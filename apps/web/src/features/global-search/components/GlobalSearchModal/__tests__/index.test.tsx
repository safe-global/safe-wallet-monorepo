import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalSearchModal } from '../index'

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => ({ allSafes: [], isLoading: false }),
}))

describe('GlobalSearchModal', () => {
  it('renders the search input', () => {
    render(<GlobalSearchModal />)

    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('renders the navigate to section with page links', () => {
    render(<GlobalSearchModal />)

    expect(screen.getByText('Navigate to')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Transaction builder')).toBeInTheDocument()
  })

  it('renders the accounts section label', () => {
    render(<GlobalSearchModal />)

    expect(screen.getAllByText('Accounts')).toHaveLength(2)
  })

  it('allows typing in the search input', async () => {
    const user = userEvent.setup()
    render(<GlobalSearchModal />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    await user.type(input, 'test query')

    expect(input).toHaveValue('test query')
  })
})
