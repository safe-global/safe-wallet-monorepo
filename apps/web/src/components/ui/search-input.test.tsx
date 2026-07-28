import { fireEvent, render, screen } from '@testing-library/react'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('renders a filled, borderless search group', () => {
    const { container } = render(<SearchInput className="w-full" placeholder="Search safes" />)
    const group = container.querySelector('[data-slot="input-group"]')

    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
    expect(group).toHaveClass('h-9', 'w-full', 'bg-input', 'border-transparent')
    expect(group).not.toHaveClass('border-border')
  })

  it('forwards change events to the underlying input', () => {
    const onChange = jest.fn()

    render(<SearchInput placeholder="Search safes" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vitalik' } })

    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
