import { render, screen } from '@testing-library/react'
import SearchInput from './SearchInput'

describe('SearchInput', () => {
  it('renders a disabled search input with placeholder text', () => {
    render(<SearchInput />)

    const input = screen.getByPlaceholderText('Search for anything')
    expect(input).toBeInTheDocument()
    expect(input).toBeDisabled()
  })
})
