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
const address = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'

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

  it('opens on hover regardless of clipping when the tooltip reveals more than the text', () => {
    expect(shouldOpenTooltip(true, 'trigger-hover', fits, true)).toBe(true)
  })

  it('still ignores focus when the tooltip reveals more than the text', () => {
    expect(shouldOpenTooltip(true, 'trigger-focus', fits, true)).toBe(false)
  })

  it('does not open when there is no element to measure', () => {
    expect(shouldOpenTooltip(true, 'trigger-hover', null)).toBe(false)
  })
})

describe('TruncatedText', () => {
  it('renders the full text and forwards props to the truncating element', () => {
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)
    expect(screen.getByTestId('name')).toHaveTextContent(longName)
  })

  it('wires the full text into the tooltip content', () => {
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(longName)
  })

  it('reveals fullText instead, where the rendered text is already an abbreviation', () => {
    render(<TruncatedText text="0x9fC3...213e" fullText={address} data-testid="address" />)

    expect(screen.getByTestId('address')).toHaveTextContent('0x9fC3...213e')
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(address)
  })
})
