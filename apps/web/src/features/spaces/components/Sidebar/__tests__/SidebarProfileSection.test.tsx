import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { SidebarProfileSection } from '../SidebarProfileSection'

const mockUseCurrentMemberProfile = jest.fn()
const mockLogout = jest.fn()

jest.mock('@/features/spaces', () => ({
  useCurrentMemberProfile: () => mockUseCurrentMemberProfile(),
  MemberStatus: { INVITED: 'INVITED', ACTIVE: 'ACTIVE', DECLINED: 'DECLINED' },
}))

jest.mock('@/hooks/useLogout', () => ({
  __esModule: true,
  default: () => ({ logout: mockLogout }),
}))

jest.mock('@safe-global/utils/utils/formatters', () => ({
  shortenAddress: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarFooter: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <button data-testid={testId}>{children}</button>
  ),
}))

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}))

jest.mock('@/features/spaces/components/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar">{name}</div>,
}))

describe('SidebarProfileSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMember = (overrides: Record<string, unknown> = {}) => ({
    id: faker.number.int(),
    name: faker.person.firstName(),
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    user: { id: faker.number.int(), status: 'ACTIVE' as const },
    ...overrides,
  })

  const activeMember = createMember()
  const adminMember = createMember({ role: 'ADMIN' as const })
  const invitedMember = createMember({ status: 'INVITED' as const })

  it('renders member name and InitialsAvatar when authenticated with active membership', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByTestId('sidebar-profile-section')).toBeInTheDocument()
    expect(screen.getAllByText(activeMember.name).length).toBeGreaterThanOrEqual(1)
  })

  it('renders skeleton when loading', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: undefined,
      walletAddress: undefined,
      isLoading: true,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByTestId('sidebar-profile-skeleton')).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  it('renders nothing when loaded but no membership found', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: undefined,
      walletAddress: undefined,
      isLoading: false,
    })

    const { container } = render(<SidebarProfileSection />)

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for invited members', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: invitedMember,
      walletAddress: undefined,
      isLoading: false,
    })

    const { container } = render(<SidebarProfileSection />)

    expect(container.innerHTML).toBe('')
  })

  it('shows popover content with member name, role, and signed in label', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('Signed in')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
    expect(screen.getAllByTestId('initials-avatar')).toHaveLength(2)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls logout when sign-out button is clicked', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    fireEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('displays admin for ADMIN role', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: adminMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('displays member for MEMBER role', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('falls back to "User" when member name is empty', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: { ...activeMember, name: '' },
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByText('User')).toHaveLength(4)
  })

  it('shows truncated wallet address in popover when user has wallets', () => {
    const walletAddress = faker.finance.ethereumAddress()
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    const shortened = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    expect(screen.getByText(shortened)).toBeInTheDocument()
  })

  it('shows member name in popover when user has no wallets', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByText(activeMember.name).length).toBeGreaterThanOrEqual(2)
  })

  it('renders separator dividers', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      walletAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByTestId('separator')).toHaveLength(2)
  })
})
