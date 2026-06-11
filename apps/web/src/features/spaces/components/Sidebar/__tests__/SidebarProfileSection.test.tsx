import { render, screen, fireEvent, within } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { SidebarProfileSection } from '../SidebarProfileSection'

const mockUseCurrentMemberProfile = jest.fn()
const mockLogout = jest.fn()

jest.mock('@/features/spaces', () => ({
  useCurrentMemberProfile: () => mockUseCurrentMemberProfile(),
  getMemberDisplayName: (member: { name: string; alias?: string | null }) => member.alias || member.name,
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

jest.mock('@/components/common/InitialsAvatar', () => ({
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
  const declinedMember = createMember({ status: 'DECLINED' as const })

  it('renders member name when active membership', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByTestId('sidebar-profile-section')).toBeInTheDocument()
    expect(screen.getAllByText(activeMember.name).length).toBeGreaterThanOrEqual(1)
  })

  it('renders skeleton when loading with no membership yet', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: undefined,
      signerAddress: undefined,
      isLoading: true,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByTestId('sidebar-profile-skeleton')).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton')).toHaveLength(2)
  })

  it('renders profile (not skeleton) when refetching with cached membership', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: true,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByTestId('sidebar-profile-section')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-profile-skeleton')).not.toBeInTheDocument()
  })

  it('renders nothing when loaded but no membership', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: undefined,
      signerAddress: undefined,
      isLoading: false,
    })

    const { container } = render(<SidebarProfileSection />)

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for invited members', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: invitedMember,
      signerAddress: undefined,
      isLoading: false,
    })

    const { container } = render(<SidebarProfileSection />)

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for declined members', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: declinedMember,
      signerAddress: undefined,
      isLoading: false,
    })

    const { container } = render(<SidebarProfileSection />)

    expect(container.innerHTML).toBe('')
  })

  it('shows popover content with member name, role, and signed in label', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('Signed in')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
    expect(screen.getAllByTestId('initials-avatar')).toHaveLength(1)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls logout when sign-out button is clicked', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    fireEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('displays admin for ADMIN role', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: adminMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('displays member for MEMBER role', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('falls back to "User" when member name is empty', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: { ...activeMember, name: '' },
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByText('User')).toHaveLength(3)
  })

  it('shows truncated signer address when signerAddress is present', () => {
    const signerAddress = faker.finance.ethereumAddress()
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    const shortened = `${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}`
    expect(screen.getByText(shortened)).toBeInTheDocument()
  })

  it('shows email as sidebar profile identity when email is present', () => {
    const email = faker.internet.email().toLowerCase()
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      email,
      signerAddress: faker.finance.ethereumAddress(),
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    const popoverEmailElements = within(screen.getByTestId('sidebar-profile-popover')).getAllByText(email)

    expect(popoverEmailElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(email).length).toBeGreaterThan(popoverEmailElements.length)
  })

  it('shows member name in popover when signerAddress is absent', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByText(activeMember.name).length).toBeGreaterThanOrEqual(2)
  })

  it('renders separator dividers', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMember,
      signerAddress: undefined,
      isLoading: false,
    })

    render(<SidebarProfileSection />)

    expect(screen.getAllByTestId('separator')).toHaveLength(2)
  })
})
