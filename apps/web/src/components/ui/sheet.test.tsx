import { render, screen } from '@testing-library/react'
import { Sheet, SheetContent, SheetHeader, SheetFooter } from './sheet'

describe('SheetContent', () => {
  it('detaches the panel from the edge with variant="floating"', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" variant="floating" showCloseButton={false}>
          Body
        </SheetContent>
      </Sheet>,
    )

    const content = screen.getByTestId('content')
    // Floating tokens that don't collide with the base string.
    expect(content).toHaveClass('rounded-3xl', 'overflow-hidden')
    // Floating uses shadow-xl; twMerge collapses the base shadow-lg away.
    expect(content).toHaveClass('shadow-xl')
    expect(content).not.toHaveClass('shadow-lg')
  })

  it('swaps the base bg-background surface for bg-card with surface="card"', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" surface="card" showCloseButton={false}>
          Body
        </SheetContent>
      </Sheet>,
    )

    const content = screen.getByTestId('content')
    expect(content).toHaveClass('bg-card')
    expect(content).not.toHaveClass('bg-background')
  })

  it('applies the paper surface variable with surface="paper"', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" surface="paper" showCloseButton={false}>
          Body
        </SheetContent>
      </Sheet>,
    )

    const content = screen.getByTestId('content')
    expect(content).toHaveClass('bg-[var(--color-background-paper)]')
    expect(content).not.toHaveClass('bg-background')
  })

  it('removes body padding with padding="none"', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" padding="none" showCloseButton={false}>
          Body
        </SheetContent>
      </Sheet>,
    )

    expect(screen.getByTestId('content')).toHaveClass('p-0')
  })

  it('applies p-6 with padding="md"', () => {
    render(
      <Sheet open>
        <SheetContent data-testid="content" padding="md" showCloseButton={false}>
          Body
        </SheetContent>
      </Sheet>,
    )

    expect(screen.getByTestId('content')).toHaveClass('p-6')
  })

  /**
   * SheetContent `size` — widths are data-[side]-scoped so they match the base positioning
   * specificity and actually win for left/right sheets (a plain `w-*` would be outranked by
   * the base `data-[side]:*` selectors). Top/bottom sheets take full width via
   * `data-[side]:inset-x-0`, so `size` intentionally only sets left/right widths. The base
   * no longer hard-codes a side width; the default `size="sm"` supplies the original w-3/4.
   */
  describe('size', () => {
    it.each([
      ['sm', 'data-[side=right]:w-3/4'],
      ['md', 'data-[side=right]:w-[440px]'],
      ['lg', 'data-[side=right]:w-[700px]'],
      ['auto', 'data-[side=right]:w-auto'],
    ] as const)('applies the side-scoped %s width for side="right"', (size, expectedClass) => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="right" size={size} showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      const content = screen.getByTestId('content')
      expect(content).toHaveClass(expectedClass)
      // No unscoped width leaks, and no competing base width remains to outrank size.
      expect(content).not.toHaveClass('w-3/4')
      expect(content).not.toHaveClass('w-[440px]')
    })

    it('scopes the width to side="left" too', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="left" size="lg" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      expect(screen.getByTestId('content')).toHaveClass('data-[side=left]:w-[700px]')
    })

    it('defaults to sm (w-3/4) when no size is set', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="right" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      expect(screen.getByTestId('content')).toHaveClass('data-[side=right]:w-3/4')
    })

    it('does not set a side width for bottom sheets (full width via inset-x-0)', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="bottom" size="md" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      const content = screen.getByTestId('content')
      expect(content).toHaveClass('data-[side=bottom]:inset-x-0')
      // size only scopes left/right widths, so no bottom width class is emitted
      expect(content.className).not.toMatch(/data-\[side=bottom\]:w-/)
    })
  })
})

describe('SheetHeader', () => {
  it('adds a full bottom border with divided', () => {
    render(<SheetHeader data-testid="header" divided />)

    expect(screen.getByTestId('header')).toHaveClass('border-b')
  })

  it('adds a subtle bottom border with divided="subtle"', () => {
    render(<SheetHeader data-testid="header" divided="subtle" />)

    expect(screen.getByTestId('header')).toHaveClass('border-b', 'border-border/50')
  })
})

describe('SheetFooter', () => {
  it('adds a full top border with divided', () => {
    render(<SheetFooter data-testid="footer" divided />)

    expect(screen.getByTestId('footer')).toHaveClass('border-t')
  })

  it('adds a subtle top border with divided="subtle"', () => {
    render(<SheetFooter data-testid="footer" divided="subtle" />)

    expect(screen.getByTestId('footer')).toHaveClass('border-t', 'border-border/50')
  })
})
