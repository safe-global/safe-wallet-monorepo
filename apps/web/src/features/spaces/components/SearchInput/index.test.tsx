import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchInput from './index'

jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

describe('SearchInput', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the component', () => {
    render(<SearchInput onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search')
    expect(input).toBeInTheDocument()
    expect(input).toHaveRole('textbox')
    const searchIcon = screen.getByTestId('search-icon')
    expect(searchIcon).toBeInTheDocument()
  })

  it('calls onSearch with input value', async () => {
    render(<SearchInput onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search')
    fireEvent.change(input, { target: { value: 'test search' } })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test search')
    })
  })
})
