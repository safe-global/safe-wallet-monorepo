import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import type * as ReactModule from 'react'
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

// TooltipTrigger composes the popover trigger through `render`; cloning it with the
// children keeps the real trigger element (and its aria-label) in the tree.
jest.mock('@/components/ui/tooltip', () => {
  const { cloneElement } = jest.requireActual<typeof ReactModule>('react')
  return {
    Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children, render: trigger }: { children: ReactNode; render: ReactElement }) =>
      cloneElement(trigger, undefined, children),
    TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  }
})

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar">{name}</div>,
}))

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="identicon" data-address={address} />,
}))

describe('AccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a user icon trigger and the display name in the popover', () => {
    render(<AccountInfo profileName="Alice" displayName="alice@safe.global" />)

    expect(screen.getByRole('button', { name: 'Account menu, signed in as alice@safe.global' })).toBeInTheDocument()
    expect(screen.getAllByText('alice@safe.global').length).toBeGreaterThan(0)
    expect(screen.getByText('Signed in as')).toBeInTheDocument()
  })

  it('shows the wallet address in the popover when signed in with SIWE', () => {
    render(<AccountInfo profileName="User" displayName="0x1234...5678" />)

    expect(screen.getAllByText('0x1234...5678').length).toBeGreaterThan(0)
  })

  it('shows a "Signed in as" tooltip naming the account', () => {
    render(<AccountInfo profileName="User" displayName="0x1234...5678" />)

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Signed in as 0x1234...5678')
  })

  it('omits the tooltip when there is no display name', () => {
    render(<AccountInfo />)

    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument()
  })

  it('labels the trigger generically when there is no display name', () => {
    render(<AccountInfo />)

    expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument()
  })

  it('renders the sign-out button when no props are provided', () => {
    render(<AccountInfo />)

    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('passes the connected wallet through to the popover hint', () => {
    render(
      <AccountInfo
        profileName="User"
        displayName="0xB4F6...cF51"
        signerAddress="0xB4F6f4F0E0A1F0a2f0b3C4d5E6f7A8b9C0d1cF51"
        connectedWallet="0x481a0000000000000000000000000000000bFbc0"
      />,
    )

    expect(screen.getByTestId('sidebar-profile-wallet-hint')).toHaveTextContent('0x481a...Fbc0')
  })

  it('logs out and tracks the event when the sign-out button is clicked', async () => {
    render(<AccountInfo profileName="Alice" displayName="Alice" />)

    await userEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.AUTH_LOGGED_OUT, expect.any(Object))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
