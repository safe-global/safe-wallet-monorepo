import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AdminOnlyWorkspaceTooltip, ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE } from '../AdminOnlyWorkspaceTooltip'

jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => (typeof selector === 'function' ? selector({}) : selector),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => true,
}))

const mockUseUsersGetWithWalletsV1Query = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => mockUseUsersGetWithWalletsV1Query(),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

const CURRENT_USER_ID = 7

const adminMembers = [
  { role: 'ADMIN' as const, status: 'ACTIVE' as const, name: '', invitedBy: '', user: { id: CURRENT_USER_ID } },
]
const memberMembers = [
  { role: 'MEMBER' as const, status: 'ACTIVE' as const, name: '', invitedBy: '', user: { id: CURRENT_USER_ID } },
]

describe('AdminOnlyWorkspaceTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: CURRENT_USER_ID } })
  })

  it('renders children without a tooltip when the user is an active admin', () => {
    render(
      <AdminOnlyWorkspaceTooltip members={adminMembers}>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByRole('button', { name: 'Add Safe' })).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  it('wraps children in a tooltip when the user is only a member', () => {
    render(
      <AdminOnlyWorkspaceTooltip members={memberMembers}>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(ADMIN_ONLY_WORKSPACE_TOOLTIP_MESSAGE)
    expect(screen.getByRole('button', { name: 'Add Safe' })).toBeInTheDocument()
  })

  it('wraps children in a tooltip when members is undefined', () => {
    render(
      <AdminOnlyWorkspaceTooltip members={undefined}>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
  })

  it('wraps children in a tooltip when there is no current user', () => {
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })

    render(
      <AdminOnlyWorkspaceTooltip members={adminMembers}>
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
  })

  it('supports overriding the tooltip message', () => {
    render(
      <AdminOnlyWorkspaceTooltip members={memberMembers} message="Custom message">
        <button>Add Safe</button>
      </AdminOnlyWorkspaceTooltip>,
    )

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Custom message')
  })
})
