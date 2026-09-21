import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ProfilePopoverContent } from '../ProfilePopoverContent'

// PopoverContent renders into a portal only when open; render it inline here.
jest.mock('@/components/ui/popover', () => ({
  PopoverContent: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}))

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar">{name}</div>,
}))

describe('ProfilePopoverContent', () => {
  it('renders the avatar, display name, role and sign-out button', () => {
    render(<ProfilePopoverContent avatarName="Alice A" displayName="Alice" role="ADMIN" onSignOut={jest.fn()} />)

    expect(screen.getByTestId('initials-avatar')).toHaveTextContent('Alice A')
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Signed in')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('omits the role line when no role is provided', () => {
    render(<ProfilePopoverContent avatarName="Alice" displayName="Alice" onSignOut={jest.fn()} />)

    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    expect(screen.queryByText('MEMBER')).not.toBeInTheDocument()
  })

  it('calls onSignOut when the sign-out button is clicked', async () => {
    const onSignOut = jest.fn()

    render(<ProfilePopoverContent avatarName="Alice" displayName="Alice" role="MEMBER" onSignOut={onSignOut} />)

    await userEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
