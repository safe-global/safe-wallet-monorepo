import { render, screen } from '@testing-library/react'

import { Input } from './input'

describe('Input variants', () => {
  it('renders the xl surface field through props instead of className drift', () => {
    render(<Input inputSize="xl" variant="surface" placeholder="Amount" />)

    expect(screen.getByPlaceholderText('Amount')).toHaveClass('h-[66px]', 'px-4', 'bg-card')
  })
})
