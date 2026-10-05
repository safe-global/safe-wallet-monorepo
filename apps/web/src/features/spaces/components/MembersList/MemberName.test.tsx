import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import MemberName from './MemberName'

const LONG_NAME = '1234567891O1112131415161718192O2122O32425262728293O31'

const mockCurrentUserId = jest.fn<number | undefined, []>(() => undefined)
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: { id: mockCurrentUserId() } }),
}))

const longNameMember = memberBuilder()
  .with({ name: LONG_NAME, user: memberUserBuilder().with({ id: 11 }).build() })
  .build()

describe('MemberName', () => {
  beforeEach(() => {
    mockCurrentUserId.mockReturnValue(undefined)
  })

  it('truncates a long name instead of letting it overflow the column', () => {
    render(<MemberName member={longNameMember} />)

    expect(screen.getByText(LONG_NAME)).toHaveClass('truncate')
  })

  it('lets the name wrap in the compact layout', () => {
    render(<MemberName member={longNameMember} isCompact />)

    expect(screen.getByText(LONG_NAME)).not.toHaveClass('truncate')
  })

  it('keeps every flex ancestor shrinkable so truncation can take effect', () => {
    const { container } = render(<MemberName member={longNameMember} />)

    expect(container.firstChild).toHaveClass('min-w-0')
    expect(screen.getByText(LONG_NAME)).toHaveClass('min-w-0')
  })

  it('exposes the full name in a tooltip', async () => {
    render(<MemberName member={longNameMember} />)

    await userEvent.hover(screen.getByText(LONG_NAME))

    const tooltip = await screen.findByTestId('member-name-tooltip')
    expect(tooltip).toHaveTextContent(LONG_NAME)
  })

  it('keeps the "You" suffix outside the truncated name', () => {
    mockCurrentUserId.mockReturnValue(11)
    render(<MemberName member={longNameMember} />)

    const suffix = screen.getByText('You')
    expect(suffix).toHaveClass('shrink-0')
    expect(suffix).not.toBe(screen.getByText(LONG_NAME))
    expect(screen.getByText(LONG_NAME)).not.toContainElement(suffix)
  })

  it('omits the "You" suffix for other members', () => {
    mockCurrentUserId.mockReturnValue(99)
    render(<MemberName member={longNameMember} />)

    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })
})
