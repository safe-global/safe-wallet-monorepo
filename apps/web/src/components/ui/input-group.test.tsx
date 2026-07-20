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
})
