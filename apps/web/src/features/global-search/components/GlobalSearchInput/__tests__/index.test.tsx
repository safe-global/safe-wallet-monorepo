import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import GlobalSearchInput from '../index'
import * as globalSearchSlice from '@/features/global-search/store/globalSearchSlice'

describe('GlobalSearchInput', () => {
  it('renders the search button with placeholder text', () => {
    render(<GlobalSearchInput />)

    const button = screen.getByRole('button', { name: 'Search for anything' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Search for anything')
  })

  it('applies custom className', () => {
    render(<GlobalSearchInput className="max-w-md" />)

    const button = screen.getByRole('button', { name: 'Search for anything' })
    expect(button).toHaveClass('max-w-md')
  })

  it('dispatches openGlobalSearch on click', async () => {
    const spy = jest.spyOn(globalSearchSlice, 'openGlobalSearch')
    const user = userEvent.setup()

    render(<GlobalSearchInput />)
    await user.click(screen.getByRole('button', { name: 'Search for anything' }))

    expect(spy).toHaveBeenCalled()
  })
})
