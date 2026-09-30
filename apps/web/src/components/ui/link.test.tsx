import { render, screen } from '@testing-library/react'
import { Link } from './link'

describe('Link', () => {
  it('renders an anchor with href', () => {
    render(<Link href="https://safe.global">Safe</Link>)
    const link = screen.getByRole('link', { name: 'Safe' })
    expect(link).toHaveAttribute('href', 'https://safe.global')
  })

  it('applies bold weight and hover color on the default variant', () => {
    render(<Link href="#">Default</Link>)
    const { className } = screen.getByRole('link', { name: 'Default' })
    expect(className).toContain('font-bold')
    expect(className).toContain('hover:text-[var(--color-primary-light)]')
  })

  it('applies the muted variant classes', () => {
    render(
      <Link href="#" variant="muted">
        Muted
      </Link>,
    )
    expect(screen.getByRole('link', { name: 'Muted' }).className).toContain('text-muted-foreground')
  })

  it('supports polymorphic render', () => {
    render(<Link render={<button type="button" />}>Btn</Link>)
    expect(screen.getByRole('button', { name: 'Btn' })).toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(
      <Link href="#" className="custom-class">
        Custom
      </Link>,
    )
    expect(screen.getByRole('link', { name: 'Custom' }).className).toContain('custom-class')
  })
})
