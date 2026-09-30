import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { getDeterministicColor } from '@/utils/colors'
import { BackToSpaceButton } from './BackToSpaceButton'
import type { SafeWorkspaceHeaderBackToSpace } from '../types'

const mockHandleBackToSpace = jest.fn()

jest.mock('@/components/common/SpaceSafeBar/hooks/useSpaceBackLink', () => ({
  useSpaceBackLink: () => ({ handleBackToSpace: mockHandleBackToSpace }),
}))

jest.mock('@/utils/colors', () => ({
  getDeterministicColor: (name: string) => `color-${name}`,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuButton: ({
    children,
    tooltip,
    className,
    onClick,
    'data-testid': dataTestId,
  }: {
    children: ReactNode
    tooltip?: string
    className?: string
    onClick?: () => void
    'data-testid'?: string
  }) => (
    <button data-tooltip={tooltip} data-testid={dataTestId} className={className} onClick={onClick}>
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

jest.mock('../config', () => ({
  icons: {
    ChevronLeft: () => <div>ChevronLeft</div>,
  },
}))

const createProps = (overrides: Partial<SafeWorkspaceHeaderBackToSpace> = {}): SafeWorkspaceHeaderBackToSpace => ({
  variant: 'backToSpace',
  spaceName: 'My Workspace',
  spaceId: '42',
  ...overrides,
})

describe('BackToSpaceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the space name, Workspace subtitle and back chevron', () => {
    render(<BackToSpaceButton {...createProps({ spaceName: 'My Workspace' })} />)

    expect(screen.getByText('My Workspace')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('ChevronLeft')).toBeInTheDocument()
  })

  it('derives the avatar initial from the space name when no initial is provided', () => {
    render(<BackToSpaceButton {...createProps({ spaceName: 'Treasury', spaceInitial: undefined })} />)

    expect(screen.getByTestId('space-avatar-fallback')).toHaveTextContent('T')
  })

  it('uses the provided space initial when available', () => {
    render(<BackToSpaceButton {...createProps({ spaceName: 'Treasury', spaceInitial: 'X' })} />)

    expect(screen.getByTestId('space-avatar-fallback')).toHaveTextContent('X')
  })

  it('applies a deterministic avatar color derived from the space name', () => {
    const spaceName = 'Treasury'
    render(<BackToSpaceButton {...createProps({ spaceName })} />)

    expect(screen.getByTestId('space-avatar-fallback')).toHaveStyle({
      backgroundColor: getDeterministicColor(spaceName),
    })
  })

  it('does not set an avatar background color when the space name is empty', () => {
    render(<BackToSpaceButton {...createProps({ spaceName: '', spaceInitial: 'U' })} />)

    expect(screen.getByTestId('space-avatar-fallback').style.backgroundColor).toBe('')
  })

  it('delegates navigation to useSpaceBackLink when clicked', () => {
    render(<BackToSpaceButton {...createProps()} />)

    screen.getByTestId('back-to-space-button').click()

    expect(mockHandleBackToSpace).toHaveBeenCalledTimes(1)
  })
})
