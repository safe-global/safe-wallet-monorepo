import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import TruncatedText, { shouldOpenTooltip } from '../TruncatedText'

// Render the tooltip primitives inline so the wired content is assertable without a portal.
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render: element }: { render: ReactElement }) => element,
  TooltipContent: ({ children }: { children: ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
}))

const longName = 'Nested safe with more owners than fit'

describe('shouldOpenTooltip', () => {
  const clipped = { scrollWidth: 200, clientWidth: 100 }
  const fits = { scrollWidth: 80, clientWidth: 100 }

  it('does not open when opening was not requested (a close event)', () => {
    expect(shouldOpenTooltip(false, 'trigger-hover', clipped)).toBe(false)
  })

  it('does not open on focus, even when clipped', () => {
    expect(shouldOpenTooltip(true, 'trigger-focus', clipped)).toBe(false)
  })

  it('does not open on hover when the text already fits', () => {
    expect(shouldOpenTooltip(true, 'trigger-hover', fits)).toBe(false)
  })

  it('opens on hover when the text is clipped', () => {
    expect(shouldOpenTooltip(true, 'trigger-hover', clipped)).toBe(true)
  })

  it('does not open when there is no element to measure', () => {
    expect(shouldOpenTooltip(true, 'trigger-hover', null)).toBe(false)
  })
})

describe('TruncatedText', () => {
  it('renders the full text and forwards props to the truncating element', () => {
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)
    const el = screen.getByTestId('name')
    expect(el).toHaveTextContent(longName)
    expect(el).toHaveClass('truncate')
  })

  it('wires the full text into the tooltip content', () => {
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(longName)
  })
})
