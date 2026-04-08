import { render, screen } from '@testing-library/react'
import GlobalSearchInput from '../index'

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
})
