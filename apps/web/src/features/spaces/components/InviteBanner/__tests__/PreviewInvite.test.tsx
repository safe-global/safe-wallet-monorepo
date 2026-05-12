import { render, screen } from '@testing-library/react'
import PreviewInvite from '../PreviewInvite'
import { spaceBuilder } from '@/tests/builders/space'
import { faker } from '@faker-js/faker'

const EMAIL = faker.internet.email()

const mockUseInviter = jest.fn()
const mockUseSpacesGetOneV1Query = jest.fn()
const mockUseCurrentSpaceId = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    ACCEPT_INVITE: { action: 'accept invite', category: 'spaces' },
    DECLINE_INVITE: { action: 'decline invite', category: 'spaces' },
  },
  SPACE_LABELS: { preview_banner: 'preview_banner' },
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(() => true),
  useAppDispatch: () => jest.fn(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: (...args: unknown[]) => mockUseSpacesGetOneV1Query(...args),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('../useInviter', () => ({
  useInviter: (...args: unknown[]) => mockUseInviter(...args),
}))

jest.mock('../Inviter', () => ({
  __esModule: true,
  default: ({ invitedByName }: { invitedByName: string | undefined }) =>
    invitedByName ? <div data-testid="inviter">{invitedByName}</div> : null,
}))

jest.mock('../AcceptButton', () => ({
  __esModule: true,
  default: () => <button data-testid="accept-button">Accept</button>,
}))

jest.mock('../DeclineButton', () => ({
  __esModule: true,
  default: () => <button data-testid="decline-button">Decline</button>,
}))

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar" data-name={name} />,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('PreviewInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentSpaceId.mockReturnValue('42')
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: spaceBuilder().build() })
    mockUseInviter.mockReturnValue(undefined)
  })

  it('renders nothing when there is no space loaded', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: undefined })
    const { container } = render(<PreviewInvite />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the space name as the invitation target', () => {
    const space = spaceBuilder().with({ name: 'Test Space' }).build()
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: space })
    render(<PreviewInvite />)
    expect(screen.getByText('Test Space')).toBeInTheDocument()
  })

  it('passes the resolved inviter name through to the Inviter component', () => {
    mockUseInviter.mockReturnValue(EMAIL)
    render(<PreviewInvite />)
    expect(screen.getByTestId('inviter')).toHaveTextContent(EMAIL)
  })

  it('renders no inviter element when useInviter returns nothing', () => {
    render(<PreviewInvite />)
    expect(screen.queryByTestId('inviter')).not.toBeInTheDocument()
  })
})
