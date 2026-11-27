import { fireEvent, render, screen } from '@testing-library/react'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('renders a native search input inside an input group', () => {
    const { container } = render(<SearchInput placeholder="Search safes" />)

    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
    expect(container.querySelector('[data-slot="input-group"]')).toBeInTheDocument()
  })

  it('forwards change events to the underlying input', () => {
    const onChange = jest.fn()

    render(<SearchInput placeholder="Search safes" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitalik' } })

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should, when no onClear is given, leave the browser its own clear button', () => {
    render(<SearchInput placeholder="Search safes" value="ethereum" onChange={jest.fn()} />)

    expect(screen.queryByTestId('search-clear')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox').className).not.toContain('search-cancel-button')
  })

  it('should, when onClear is given and the field has text, replace it with the design system one', () => {
    render(<SearchInput placeholder="Search safes" value="ethereum" onChange={jest.fn()} onClear={jest.fn()} />)

    expect(screen.getByTestId('search-clear')).toHaveAttribute('aria-label', 'Clear search')
    // The native button takes the browser's accent colour and cannot be recoloured, so it is hidden.
    expect(screen.getByRole('searchbox').className).toContain('[&::-webkit-search-cancel-button]:hidden')
  })

  it('should, when onClear is given but the field is empty, show no clear button', () => {
    render(<SearchInput placeholder="Search safes" value="" onChange={jest.fn()} onClear={jest.fn()} />)

    expect(screen.queryByTestId('search-clear')).not.toBeInTheDocument()
  })

  it('should, when the clear button is clicked, call onClear', () => {
    const onClear = jest.fn()

    render(<SearchInput placeholder="Search safes" value="ethereum" onChange={jest.fn()} onClear={onClear} />)
    fireEvent.click(screen.getByTestId('search-clear'))

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
