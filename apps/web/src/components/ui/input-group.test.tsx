import { render, screen } from '@testing-library/react'

import { InputGroup, InputGroupInput } from './input-group'

describe('InputGroup variants', () => {
  it('renders the xl surface group through props instead of className drift', () => {
    render(
      <InputGroup inputSize="hero" variant="surface">
        <InputGroupInput placeholder="Search" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass('h-[66px]', 'px-4', 'bg-card')
  })

  it.each([
    ['sm', 'h-8'],
    ['default', 'h-9'],
    ['lg', 'h-10'],
  ] as const)('matches the Button height tier at inputSize=%s', (inputSize, expected) => {
    render(
      <InputGroup inputSize={inputSize}>
        <InputGroupInput placeholder="Search" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass(expected)
  })

  it('pins the nested control to the group height on the sm/lg tiers', () => {
    const { rerender } = render(
      <InputGroup inputSize="lg">
        <InputGroupInput placeholder="Search" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass('[&_[data-slot=input-group-control]]:h-10')

    rerender(
      <InputGroup inputSize="sm">
        <InputGroupInput placeholder="Search" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass('[&_[data-slot=input-group-control]]:h-8')
  })

  it('gives the default group a filled field surface and keeps the nested control transparent', () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Note" />
      </InputGroup>,
    )

    const group = screen.getByRole('group')
    expect(group).toHaveClass('bg-input')
    expect(group.querySelector('input')).toHaveClass('bg-transparent', 'dark:bg-transparent')
  })

  it('drops the resting border on the search variant but keeps it on the others', () => {
    const { rerender } = render(
      <InputGroup variant="search">
        <InputGroupInput placeholder="Search" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass('bg-input', 'border-transparent')
    expect(screen.getByRole('group')).not.toHaveClass('border-border')

    rerender(
      <InputGroup variant="default">
        <InputGroupInput placeholder="Note" />
      </InputGroup>,
    )

    expect(screen.getByRole('group')).toHaveClass('border-border')
  })
})
