import { render } from '@testing-library/react'
import { Sticky } from '.'

describe('Sticky', () => {
  it('pins at the page header offset instead of a hard-coded one', () => {
    const { container } = render(
      <Sticky>
        <div>Sub-header</div>
      </Sticky>,
    )
    const wrapper = container.firstElementChild

    expect(wrapper).toHaveClass('sticky', 'top-[var(--page-header-bottom)]')
    // Opaque so scrolling rows don't show through, and black in dark mode like the page behind it.
    expect(wrapper).toHaveClass('bg-[var(--color-background-main)]', 'dark:bg-background')
    // A literal offset is what left scrolling content showing between the two bars.
    expect(wrapper?.className).not.toMatch(/top-\[\d+px\]/)
  })
})
