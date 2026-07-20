import { fireEvent, render, screen } from '@testing-library/react'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('renders a search input with the canonical surface group', () => {
    const { container } = render(<SearchInput className="w-full" placeholder="Search safes" />)

    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
    expect(container.querySelector('[data-slot="input-group"]')).toHaveClass('h-9', 'w-full', 'bg-card')
  })

  it('forwards change events to the underlying input', () => {
    const onChange = jest.fn()

    render(<SearchInput placeholder="Search safes" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitalik' } })

    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
