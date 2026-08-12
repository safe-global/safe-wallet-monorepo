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
})
