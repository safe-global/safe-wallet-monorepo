import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { getDeterministicColor } from '@/utils/colors'
import { SafeSidebarWorkspaceHeader } from '../SafeSidebarWorkspaceHeader'
import type { SafeWorkspaceHeaderBackToSpace, SafeWorkspaceHeaderAddToWorkspace } from '../../../types'

const spaceSelectorDropdownMock = jest.fn()

const mockHandleBackToSpace = jest.fn()

jest.mock('@/components/common/SpaceSafeBar/hooks/useSpaceBackLink', () => ({
  useSpaceBackLink: () => ({ handleBackToSpace: mockHandleBackToSpace }),
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div data-testid="dialog-root">{children}</div>,
  DialogTrigger: ({ children, render: renderProp }: { children: ReactNode; render?: ReactNode }) => (
    <div data-testid="dialog-trigger">
      {renderProp}
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: ReactNode }) => <div data-testid="dialog-content">{children}</div>,
}))

jest.mock('../../../../AddToSpacePopupModal/AddToSpacePopupModal', () => ({
  AddToSpacePopupModal: () => <div data-testid="add-to-space-popup-modal" />,
}))

const mockRouterPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    query: {},
    pathname: '',
  }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/utils/colors', () => ({
  getDeterministicColor: (name: string) => `color-${name}`,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuButton: ({
    children,
    isActive,
    tooltip,
    className,
    onClick,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    'aria-haspopup': ariaHaspopup,
  }: {
    children: ReactNode
    isActive?: boolean
    tooltip?: string
    className?: string
    onClick?: () => void
    'data-testid'?: string
    'aria-label'?: string
    'aria-haspopup'?: string
  }) => (
    <button
      data-active={isActive}
      data-tooltip={tooltip}
      data-testid={dataTestId}
      data-aria-label={ariaLabel}
      data-aria-haspopup={ariaHaspopup}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  AvatarFallback: ({
    children,
    className,
    style,
  }: {
    children: ReactNode
    className?: string
    style?: CSSProperties
  }) => (
    <div data-testid="space-avatar-fallback" className={className} style={style}>
      {children}
    </div>
  ),
}))

jest.mock('../../../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
}))

jest.mock('../../SpaceSelectorDropdown', () => ({
  SpaceSelectorDropdown: (props: {
    triggerVariant?: 'default' | 'addToWorkspace'
    selectedSpace?: unknown
    spaces?: unknown
    onSpaceAdded?: () => void
  }) => {
    spaceSelectorDropdownMock(props)
    return props.triggerVariant === 'addToWorkspace' ? (
      <button type="button" data-testid="add-safe-to-workspace-button">
        Add Safe to workspace
      </button>
    ) : (
      <div data-testid="space-selector-default">Space selector</div>
    )
  },
}))

const createBackHeader = (overrides: Partial<SafeWorkspaceHeaderBackToSpace> = {}): SafeWorkspaceHeaderBackToSpace => ({
  variant: 'backToSpace',
  spaceName: 'Test Safe',
  spaceId: '123',
  ...overrides,
})

const createAddHeader = (
  overrides: Partial<SafeWorkspaceHeaderAddToWorkspace> = {},
): SafeWorkspaceHeaderAddToWorkspace => ({
  variant: 'addToWorkspace',
  spaces: [],
  ...overrides,
})

const CURRENT_USER_ID = 7

const adminMembers = [
  {
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    name: '',
    invitedBy: null,
    inviteExpiresAt: null,
    user: { id: CURRENT_USER_ID },
  },
]
const memberMembers = [
  {
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    name: '',
    invitedBy: null,
    inviteExpiresAt: null,
    user: { id: CURRENT_USER_ID },
  },
]

describe('SafeSidebarWorkspaceHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('variant backToSpace', () => {
    it('renders space name and back affordance when spaceId exists', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({
            spaceName: 'My Safe account',
            spaceInitial: 'M',
            spaceId: '123',
          })}
        />,
      )

      expect(screen.getByText('My Safe account')).toBeInTheDocument()
      expect(screen.getByText('Workspace')).toBeInTheDocument()
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
    })

    it('applies deterministic avatar color from space name', () => {
      const spaceName = 'My Safe account'

      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({ spaceName, spaceInitial: 'M', spaceId: '123' })}
        />,
      )

      expect(screen.getByTestId('space-avatar-fallback')).toHaveStyle({
        backgroundColor: getDeterministicColor(spaceName),
      })
    })

    it('does not set avatar background when space name is empty', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({ spaceName: '', spaceInitial: 'U', spaceId: '123' })}
        />,
      )

      expect(screen.getByTestId('space-avatar-fallback').style.backgroundColor).toBe('')
    })

    it('derives initial from space name when spaceInitial not provided', () => {
      render(
        <SafeSidebarWorkspaceHeader workspaceHeader={createBackHeader({ spaceName: 'MySpace', spaceId: '123' })} />,
      )

      expect(screen.getByText('M')).toBeInTheDocument()
    })

    it('uses provided spaceInitial when available', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({ spaceName: 'MySpace', spaceInitial: 'X', spaceId: '123' })}
        />,
      )

      expect(screen.getByText('X')).toBeInTheDocument()
    })

    it('handles empty space name with fallback initial', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({ spaceName: '', spaceInitial: 'U', spaceId: '123' })}
        />,
      )

      expect(screen.getByText('U')).toBeInTheDocument()
    })

    it('delegates back navigation to useSpaceBackLink when the back button is clicked', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({
            spaceName: 'My Safe account',
            spaceInitial: 'M',
            spaceId: '42',
          })}
        />,
      )

      screen.getByTestId('back-to-space-button').click()

      expect(mockHandleBackToSpace).toHaveBeenCalledTimes(1)
    })

    it('does not render add-to-workspace or dialog UI', () => {
      render(<SafeSidebarWorkspaceHeader workspaceHeader={createBackHeader({ spaceName: 'Test', spaceId: '1' })} />)

      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
      expect(spaceSelectorDropdownMock).not.toHaveBeenCalled()
    })
  })

  describe('variant addToWorkspace', () => {
    it('renders Dialog with modal when there are no spaces (empty array)', () => {
      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces: [] })} />)

      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
      expect(screen.getByTestId('add-to-space-popup-modal')).toBeInTheDocument()
      expect(spaceSelectorDropdownMock).not.toHaveBeenCalled()
    })

    it('renders Dialog with modal when spaces is undefined (treated as no spaces)', () => {
      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces: undefined })} />)

      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
      expect(screen.getByTestId('add-to-space-popup-modal')).toBeInTheDocument()
      expect(spaceSelectorDropdownMock).not.toHaveBeenCalled()
    })

    it('renders SpaceSelectorDropdown when at least one space exists', () => {
      const spaces = [{ id: 1, uuid: 'uuid-1', name: 'My Space', safeCount: 1, members: adminMembers }]
      const onSpaceAdded = jest.fn()

      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createAddHeader({
            spaces,
            selectedSpace: spaces[0],
            onSpaceAdded,
          })}
        />,
      )

      expect(screen.getByTestId('add-safe-to-workspace-button')).toBeInTheDocument()
      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
      expect(spaceSelectorDropdownMock).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerVariant: 'addToWorkspace',
          selectedSpace: spaces[0],
          spaces,
          onSpaceAdded,
        }),
      )
    })

    it('prefers SpaceSelectorDropdown over Dialog when multiple spaces exist', () => {
      const spaces = [
        { id: 1, uuid: 'uuid-1', name: 'A', safeCount: 1, members: adminMembers },
        { id: 2, uuid: 'uuid-2', name: 'B', safeCount: 0, members: memberMembers },
      ]

      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces })} />)

      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
      expect(spaceSelectorDropdownMock).toHaveBeenCalled()
    })

    it('renders SpaceSelectorDropdown even when the user is admin of zero spaces — rows handle the disabled state and tooltip', () => {
      const spaces = [
        { id: 1, uuid: 'uuid-1', name: 'A', safeCount: 1, members: memberMembers },
        { id: 2, uuid: 'uuid-2', name: 'B', safeCount: 0, members: memberMembers },
      ]

      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces })} />)

      expect(spaceSelectorDropdownMock).toHaveBeenCalled()
      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
    })

    it('renders SpaceSelectorDropdown when the user is admin of at least one space', () => {
      const spaces = [
        { id: 1, uuid: 'uuid-1', name: 'A', safeCount: 1, members: memberMembers },
        { id: 2, uuid: 'uuid-2', name: 'B', safeCount: 0, members: adminMembers },
      ]

      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces })} />)

      expect(spaceSelectorDropdownMock).toHaveBeenCalled()
    })

    it('renders Add Safe to space trigger and popup inside Dialog when not in a Space', () => {
      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader()} />)

      expect(screen.queryByText('ChevronLeft')).not.toBeInTheDocument()
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
      expect(screen.getByText('Add Safe to workspace')).toBeInTheDocument()
      expect(screen.getByTestId('add-to-space-popup-modal')).toBeInTheDocument()
    })
  })
})
