import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AdminOnlyWorkspaceTooltip, ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE } from '../AdminOnlyWorkspaceTooltip'

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

describe('AdminOnlyWorkspaceTooltip', () => {
  it('renders children without a tooltip when isAdmin is true', () => {
    render(
      <AdminOnlyWorkspaceTooltip isAdmin>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByRole('button', { name: 'Add Safe' })).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  it('wraps children in a tooltip when isAdmin is false', () => {
    render(
      <AdminOnlyWorkspaceTooltip isAdmin={false}>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE)
    expect(screen.getByRole('button', { name: 'Add Safe' })).toBeInTheDocument()
  })

  it('supports overriding the tooltip message', () => {
    render(
      <AdminOnlyWorkspaceTooltip isAdmin={false} message="Custom message">
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Custom message')
  })
})
