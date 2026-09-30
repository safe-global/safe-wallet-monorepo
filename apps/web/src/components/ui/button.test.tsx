import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NextLink from 'next/link'
import { Button } from './button'

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

  it('keeps a disabled anchor button inert', async () => {
    const onClick = jest.fn()

    render(
      <Button disabled onClick={onClick} render={<NextLink href="/nested-safe" />}>
        Go to Nested Safe
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Go to Nested Safe' })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('tabindex', '-1')
    // an <a disabled> is invalid HTML and inert, so the attribute must not be forwarded
    expect(link).not.toHaveAttribute('disabled')

    await userEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('leaves an enabled anchor button clickable', async () => {
    const onClick = jest.fn()

    render(
      <Button onClick={onClick} render={<NextLink href="/nested-safe" />}>
        Go to Nested Safe
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Go to Nested Safe' })
    expect(link).toHaveAttribute('href', '/nested-safe')
    expect(link).not.toHaveAttribute('aria-disabled')
    expect(link).not.toHaveAttribute('tabindex')

    await userEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("keeps the render element's own onClick when Button has none", async () => {
    const onClick = jest.fn()

    render(<Button render={<NextLink href="/nested-safe" onClick={onClick} />}>Go to Nested Safe</Button>)

    await userEvent.click(screen.getByRole('link', { name: 'Go to Nested Safe' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('marks a disabled non-native render element as disabled', () => {
    render(
      <Button disabled render={<span />}>
        Go to Nested Safe
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Go to Nested Safe' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('marks a disabled native button as disabled', () => {
    render(<Button disabled>Go to Nested Safe</Button>)

    expect(screen.getByRole('button', { name: 'Go to Nested Safe' })).toBeDisabled()
  })
})
