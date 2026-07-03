import { render, screen } from '@testing-library/react'
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
})
