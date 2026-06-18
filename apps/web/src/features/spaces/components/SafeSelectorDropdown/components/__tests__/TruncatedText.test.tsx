import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import TruncatedText from '../TruncatedText'

const mockUseIsTruncated = jest.fn<boolean, []>()
jest.mock('../../hooks/useIsTruncated', () => ({
  useIsTruncated: () => mockUseIsTruncated(),
}))

// Render the tooltip primitives inline so the conditional content is assertable without a portal.
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render: element }: { render: ReactElement }) => element,
  TooltipContent: ({ children }: { children: ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
}))

const longName = 'Nested safe with more owners than fit'

describe('TruncatedText', () => {
  beforeEach(() => {
    mockUseIsTruncated.mockReset()
  })

  it('renders the full text and forwards props to the truncating element', () => {
    mockUseIsTruncated.mockReturnValue(false)
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)

    const el = screen.getByTestId('name')
    expect(el).toHaveTextContent(longName)
    expect(el).toHaveClass('truncate')
  })

  it('does not render a tooltip when the text is not clipped', () => {
    mockUseIsTruncated.mockReturnValue(false)
    render(<TruncatedText text="Short" variant="paragraph-small-medium" data-testid="name" />)

    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()
  })

  it('reveals the full text in a tooltip when the text is clipped', () => {
    mockUseIsTruncated.mockReturnValue(true)
    render(<TruncatedText text={longName} variant="paragraph-small-medium" data-testid="name" />)

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(longName)
  })
})
