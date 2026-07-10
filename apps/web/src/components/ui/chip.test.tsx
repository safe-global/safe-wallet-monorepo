import { render, screen, fireEvent } from '@testing-library/react'
import { Chip } from './chip'

describe('Chip', () => {
  it('renders its label', () => {
    render(<Chip>Pending</Chip>)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('does not render a delete button without onDelete', () => {
    render(<Chip>Static</Chip>)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('fires onDelete when the delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<Chip onDelete={onDelete}>Removable</Chip>)
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('applies the outline variant classes', () => {
    render(<Chip variant="outline">Outline</Chip>)
    expect(screen.getByText('Outline').className).toContain('border')
  })

  it('applies a semantic variant tint', () => {
    render(<Chip variant="warning">Warning</Chip>)
    expect(screen.getByText('Warning').className).toContain('bg-warning-subtle')
  })

  it('applies size classes', () => {
    render(<Chip size="sm">Small</Chip>)
    expect(screen.getByText('Small').className).toContain('h-5')
  })

  it('applies the tag shape', () => {
    render(<Chip shape="tag">Tag</Chip>)
    expect(screen.getByText('Tag').className).toContain('rounded-sm')
  })

  it('defaults to the pill shape', () => {
    render(<Chip>Pill</Chip>)
    expect(screen.getByText('Pill').className).toContain('rounded-4xl')
  })
})
