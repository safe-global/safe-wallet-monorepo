import { render, screen } from '@testing-library/react'
import { Tag } from './tag'

describe('Tag', () => {
  it('defaults to the neutral tag colour', () => {
    render(<Tag>Vendor</Tag>)
    const tag = screen.getByText('Vendor')
    expect(tag).toHaveAttribute('data-color', 'default')
    expect(tag).toHaveClass('bg-tag-default', 'text-tag-default-foreground')
  })

  it('uses the theme tag tokens for a named colour', () => {
    render(<Tag color="cobalt">Send</Tag>)
    const tag = screen.getByText('Send')
    expect(tag).toHaveAttribute('data-color', 'cobalt')
    expect(tag).toHaveClass('bg-tag-cobalt', 'text-tag-cobalt-foreground')
  })

  it('keeps layout classes passed by the caller', () => {
    render(<Tag className="ml-2">Treasury</Tag>)
    expect(screen.getByText('Treasury')).toHaveClass('ml-2', 'h-6')
  })
})
