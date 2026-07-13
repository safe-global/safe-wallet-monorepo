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
   * AUDIT — SheetContent `size` is a NO-OP for left/right sheets.
   *
   * The base string carries side-scoped widths `data-[side=right]:w-3/4` /
   * `data-[side=left]:w-3/4` (plus `data-[side=*]:sm:max-w-sm`). Those compile to
   * attribute-qualified selectors (e.g. `...[data-side="right"]`) whose specificity
   * (class + attribute) beats the plain, unmodified `w-[440px]` utility emitted by
   * `size`. `cn`/twMerge keeps BOTH classes on the element (different variants never
   * merge), so at runtime the higher-specificity base width wins and the `size` width
   * never takes effect on right/left sheets.
   *
   * `data-[side=bottom]` / `data-[side=top]` have NO side-scoped width class, so for
   * those sides the `size` width utility is the only width class present and is not
   * outranked.
   *
   * The tests below assert only what is real: the `size` class string is emitted, and
   * the competing base width class is / isn't present per side. We deliberately do NOT
   * assert an effective computed width — that would falsely imply `size` works for
   * right/left when it does not.
   */
  describe('size', () => {
    it.each([
      ['sm', 'w-3/4'],
      ['md', 'w-[440px]'],
      ['lg', 'w-[700px]'],
      ['auto', 'w-auto'],
    ] as const)('emits the %s size width utility onto the class string', (size, expectedClass) => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="right" size={size} showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      expect(screen.getByTestId('content')).toHaveClass(expectedClass)
    })

    it('does NOT change width for side="right": the base w-3/4 outranks the size width (no-op)', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="right" size="md" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      const content = screen.getByTestId('content')
      // The size token is emitted...
      expect(content).toHaveClass('w-[440px]')
      // ...but this higher-specificity base class coexists and wins, so size is a no-op.
      expect(content).toHaveClass('data-[side=right]:w-3/4')
    })

    it('does NOT change width for side="left": the base w-3/4 outranks the size width (no-op)', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="left" size="lg" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      const content = screen.getByTestId('content')
      expect(content).toHaveClass('w-[700px]')
      expect(content).toHaveClass('data-[side=left]:w-3/4')
    })

    it('has no competing base width class for side="bottom", so the size width is not overridden', () => {
      render(
        <Sheet open>
          <SheetContent data-testid="content" side="bottom" size="md" showCloseButton={false}>
            Body
          </SheetContent>
        </Sheet>,
      )

      const content = screen.getByTestId('content')
      expect(content).toHaveClass('w-[440px]')
      // No `data-[side=bottom]:w-*` base class exists, so nothing outranks the size width.
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
