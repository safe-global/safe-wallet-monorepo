import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { render, screen } from '@/tests/test-utils'
import AllowlistSummary from '../AllowlistSummary'

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, render }: { children: ReactNode; render: ReactElement }) =>
    cloneElement(render, {}, children),
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

describe('AllowlistSummary', () => {
  it('should show the title and the description, and the details behind the info icon', () => {
    render(
      <AllowlistSummary
        title="You're editing the allowlist on Payments."
        description="Anything you deselect will be blocked once the change applies."
        details="The change applies after the delay."
      />,
    )

    expect(screen.getByText("You're editing the allowlist on Payments.")).toBeInTheDocument()
    expect(screen.getByText('Anything you deselect will be blocked once the change applies.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'When this takes effect' })).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('The change applies after the delay.')
  })
})
