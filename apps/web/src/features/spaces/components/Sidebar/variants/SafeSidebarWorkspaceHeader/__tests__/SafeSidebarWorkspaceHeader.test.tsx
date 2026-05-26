import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { getDeterministicColor } from '@/features/spaces'
import { SafeSidebarWorkspaceHeader } from '../SafeSidebarWorkspaceHeader'
import type { SafeWorkspaceHeaderBackToSpace, SafeWorkspaceHeaderAddToWorkspace } from '../../../types'
import { AppRoutes } from '@/config/routes'

const spaceSelectorDropdownMock = jest.fn()

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
  getDeterministicColor: (name: string) => `color-${name}`,
  useCurrentSpaceId: () => '42',
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

describe('SafeSidebarWorkspaceHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('variant backToSpace', () => {
    it('renders space name and back affordance when spaceId exists', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({
            spaceName: 'My Safe Account',
            spaceInitial: 'M',
            spaceId: '123',
          })}
        />,
      )

      expect(screen.getByText('My Safe Account')).toBeInTheDocument()
      expect(screen.getByText('Workspace')).toBeInTheDocument()
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
    })

    it('applies deterministic avatar color from space name', () => {
      const spaceName = 'My Safe Account'

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

    it('navigates to the correct Space when back button is clicked', () => {
      render(
        <SafeSidebarWorkspaceHeader
          workspaceHeader={createBackHeader({
            spaceName: 'My Safe Account',
            spaceInitial: 'M',
            spaceId: '42',
          })}
        />,
      )

      screen.getByTestId('back-to-space-button').click()

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: AppRoutes.spaces.index,
        query: { spaceId: '42' },
      })
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
      const spaces = [{ id: 1, name: 'My Space', safeCount: 1 }]
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
        { id: 1, name: 'A', safeCount: 1 },
        { id: 2, name: 'B', safeCount: 0 },
      ]

      render(<SafeSidebarWorkspaceHeader workspaceHeader={createAddHeader({ spaces })} />)

      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
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
