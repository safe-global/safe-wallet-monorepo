import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { AccountInfo } from '../AccountInfo'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const mockLogout = jest.fn()
const mockTrackEvent = jest.fn()

jest.mock('@/hooks/useLogout', () => ({
  __esModule: true,
  default: () => ({ logout: mockLogout }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

// Render the Base UI popover content inline so the trigger does not need to be
// opened (the real component renders content into a portal only when open).
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children, 'aria-label': ariaLabel }: { children: ReactNode; 'aria-label'?: string }) => (
    <button aria-label={ariaLabel}>{children}</button>
  ),
  PopoverContent: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}))

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar">{name}</div>,
}))

describe('AccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a user icon trigger and the display name in the popover', () => {
    render(<AccountInfo profileName="Alice" displayName="alice@safe.global" />)

    expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument()
    expect(screen.getByText('alice@safe.global')).toBeInTheDocument()
    expect(screen.getByText('Signed in')).toBeInTheDocument()
  })

  it('shows the wallet address in the popover when signed in with SIWE', () => {
    render(<AccountInfo profileName="User" displayName="0x1234...5678" />)

    expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
  })

  it('renders the sign-out button when no props are provided', () => {
    render(<AccountInfo />)

    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('logs out and tracks the event when the sign-out button is clicked', async () => {
    render(<AccountInfo profileName="Alice" displayName="Alice" />)

    await userEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGGED_OUT, expect.any(Object))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
