import { render, screen } from '@testing-library/react'
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './dialog'

describe('DialogContent', () => {
  it.each([
    ['xs', 'max-w-[444px]'],
    ['sm', 'max-w-[600px]'],
    ['md', 'max-w-[900px]'],
    ['lg', 'max-w-[1200px]'],
    ['xl', 'max-w-[1536px]'],
  ] as const)('applies the %s size max-width utility', (size, expectedClass) => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" size={size} showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByTestId('content')).toHaveClass(expectedClass)
  })

  it('defaults to the 500px max-width when no size is given', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByTestId('content')).toHaveClass('max-w-[500px]')
  })

  it('removes body padding with padding="none"', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" padding="none" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByTestId('content')).toHaveClass('p-0')
  })

  it('applies p-6 with padding="md"', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" padding="md" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByTestId('content')).toHaveClass('p-6')
  })

  it('swaps the base bg-dialog surface for bg-card with surface="card"', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" surface="card" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    const content = screen.getByTestId('content')
    expect(content).toHaveClass('bg-card')
    // twMerge collapses the conflicting background utility, so the base is gone.
    expect(content).not.toHaveClass('bg-dialog')
  })

  it('applies the paper surface variable with surface="paper"', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" surface="paper" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    const content = screen.getByTestId('content')
    expect(content).toHaveClass('bg-[var(--color-background-paper)]')
    expect(content).not.toHaveClass('bg-dialog')
  })
})

describe('DialogHeader', () => {
  it('adds a full bottom border with divided', () => {
    render(<DialogHeader data-testid="header" divided />)

    expect(screen.getByTestId('header')).toHaveClass('border-b')
  })

  it('adds a subtle bottom border with divided="subtle"', () => {
    render(<DialogHeader data-testid="header" divided="subtle" />)

    expect(screen.getByTestId('header')).toHaveClass('border-b', 'border-border/50')
  })

  it('has no border by default', () => {
    render(<DialogHeader data-testid="header" />)

    const header = screen.getByTestId('header')
    expect(header).not.toHaveClass('border-b')
    expect(header).not.toHaveClass('border-border/50')
  })
})

describe('DialogFooter', () => {
  it('adds a full top border with divided', () => {
    render(<DialogFooter data-testid="footer" divided />)

    expect(screen.getByTestId('footer')).toHaveClass('border-t')
  })

  it('adds a subtle top border with divided="subtle"', () => {
    render(<DialogFooter data-testid="footer" divided="subtle" />)

    expect(screen.getByTestId('footer')).toHaveClass('border-t', 'border-border/50')
  })
})
