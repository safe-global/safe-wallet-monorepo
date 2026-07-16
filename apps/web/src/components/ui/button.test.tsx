import { render, screen } from '@testing-library/react'
import NextLink from 'next/link'
import { buttonVariants } from './button'
import { Button } from './button'

describe('buttonVariants', () => {
  it('uses tokenized classes for the outline variant', () => {
    const className = buttonVariants({ variant: 'outline' })

    expect(className).toContain('bg-background')
    expect(className).toContain('hover:bg-muted')
    expect(className).not.toContain('rgba')
    expect(className).not.toContain('unofficial')
  })

  it('renders the surface variant as a raised card CTA', () => {
    render(
      <Button data-testid="surface" variant="surface">
        Add funds
      </Button>,
    )

    const button = screen.getByTestId('surface')
    expect(button).toHaveClass('bg-card', 'border-border', 'shadow-xs', 'text-card-foreground')
    // border-transparent from the base string is overridden by border-border
    expect(button).not.toHaveClass('border-transparent')
  })

  it('renders the destructive-outline variant as a bordered destructive button', () => {
    render(
      <Button data-testid="destructive-outline" variant="destructive-outline">
        Leave workspace
      </Button>,
    )

    const button = screen.getByTestId('destructive-outline')
    expect(button).toHaveClass('border-border', 'text-destructive', 'bg-background', 'shadow-xs')
  })

  it('applies the action size CTA pill scale', () => {
    render(
      <Button data-testid="action" size="action">
        Send
      </Button>,
    )

    expect(screen.getByTestId('action')).toHaveClass('h-10', 'px-6', 'gap-2')
  })

  it('applies the submit size with a stable minimum width', () => {
    render(
      <Button data-testid="submit" size="submit">
        Execute
      </Button>,
    )

    expect(screen.getByTestId('submit')).toHaveClass('h-10', 'px-6', 'min-w-[7rem]')
  })

  it('applies the xl footer CTA scale', () => {
    render(
      <Button data-testid="xl" size="xl">
        Continue
      </Button>,
    )

    expect(screen.getByTestId('xl')).toHaveClass('h-12', 'px-6', 'gap-2')
  })
})

describe('Button', () => {
  it('renders anchor buttons without requesting native button semantics', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    try {
      render(<Button render={<a href="/docs" />}>Docs</Button>)

      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  it('renders Next.js link buttons without requesting native button semantics', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()

    try {
      render(<Button render={<NextLink href="/welcome" />}>Welcome</Button>)

      expect(screen.getByRole('link', { name: 'Welcome' })).toHaveAttribute('href', '/welcome')
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })
})
