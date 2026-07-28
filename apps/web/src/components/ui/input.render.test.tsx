import { render, screen } from '@testing-library/react'

import { Input } from './input'

describe('Input variants', () => {
  it('renders the xl surface field through props instead of className drift', () => {
    render(<Input inputSize="hero" variant="surface" placeholder="Amount" />)

    expect(screen.getByPlaceholderText('Amount')).toHaveClass('h-[66px]', 'px-4', 'bg-card')
  })

  it.each([
    ['sm', 'h-8'],
    ['default', 'h-9'],
    ['lg', 'h-10'],
  ] as const)('matches the Button height tier at inputSize=%s', (inputSize, expected) => {
    render(<Input inputSize={inputSize} placeholder={`field ${inputSize}`} />)

    expect(screen.getByPlaceholderText(`field ${inputSize}`)).toHaveClass(expected, 'px-3')
  })

  it('renders the explicit default size at h-9', () => {
    render(<Input inputSize="default" placeholder="Explicit default" />)

    expect(screen.getByPlaceholderText('Explicit default')).toHaveClass('h-9', 'px-3')
  })

  it('locks the default size to h-9 when no inputSize prop is provided', () => {
    render(<Input placeholder="Implicit default" />)

    const field = screen.getByPlaceholderText('Implicit default')
    expect(field).toHaveClass('h-9', 'px-3')
    expect(field).not.toHaveClass('h-8', 'h-10', 'h-[66px]')
  })

  it('renders the default variant with a filled field surface', () => {
    render(<Input variant="default" placeholder="Default surface" />)

    expect(screen.getByPlaceholderText('Default surface')).toHaveClass('bg-input')
  })

  it('locks the default variant to a filled field surface when no variant prop is provided', () => {
    render(<Input placeholder="Implicit variant" />)

    const field = screen.getByPlaceholderText('Implicit variant')
    expect(field).toHaveClass('bg-input')
    expect(field).not.toHaveClass('bg-transparent', 'bg-card')
  })
})
