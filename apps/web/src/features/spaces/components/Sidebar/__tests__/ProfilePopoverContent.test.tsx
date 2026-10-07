import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ProfilePopoverContent } from '../ProfilePopoverContent'

const SIGNER = '0xB4F6f4F0E0A1F0a2f0b3C4d5E6f7A8b9C0d1cF51'
const CONNECTED = '0x481a0000000000000000000000000000000bFbc0'

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

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="identicon" data-address={address} />,
}))

describe('ProfilePopoverContent', () => {
  it('renders the avatar, display name, role and sign-out button', () => {
    render(<ProfilePopoverContent avatarName="Alice A" displayName="Alice" role="ADMIN" onSignOut={jest.fn()} />)

    expect(screen.getByTestId('initials-avatar')).toHaveTextContent('Alice A')
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('Your account')).toBeInTheDocument()
    expect(screen.getByText('Manages your Safe Pro subscription.')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('omits the role line when no role is provided', () => {
    render(<ProfilePopoverContent avatarName="Alice" displayName="Alice" onSignOut={jest.fn()} />)

    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    expect(screen.queryByText('MEMBER')).not.toBeInTheDocument()
  })

  it('renders the signer identicon instead of the initials avatar for wallet sign-ins', () => {
    render(
      <ProfilePopoverContent
        avatarName="User"
        displayName="0xB4F6...cF51"
        signerAddress={SIGNER}
        onSignOut={jest.fn()}
      />,
    )

    expect(screen.getByTestId('identicon')).toHaveAttribute('data-address', SIGNER)
    expect(screen.queryByTestId('initials-avatar')).not.toBeInTheDocument()
  })

  it('keeps the initials avatar and renders no identicon for email sign-ins', () => {
    render(
      <ProfilePopoverContent avatarName="alice@safe.global" displayName="alice@safe.global" onSignOut={jest.fn()} />,
    )

    expect(screen.getByTestId('initials-avatar')).toBeInTheDocument()
    expect(screen.queryByTestId('identicon')).not.toBeInTheDocument()
  })

  it('shows the connected wallet as its own section when one is passed', () => {
    render(
      <ProfilePopoverContent
        avatarName="User"
        displayName="0xB4F6...cF51"
        signerAddress={SIGNER}
        connectedWallet={CONNECTED}
        onSignOut={jest.fn()}
      />,
    )

    const walletSection = screen.getByTestId('sidebar-profile-wallet-hint')
    expect(walletSection).toHaveTextContent('Connected wallet')
    expect(walletSection).toHaveTextContent('0x481a...Fbc0')
    expect(walletSection).toHaveTextContent('Signs and executes transactions.')
    expect(screen.getAllByTestId('identicon').map((el) => el.getAttribute('data-address'))).toContain(CONNECTED)
  })

  it('hides the connected wallet section when no connected wallet is passed', () => {
    render(
      <ProfilePopoverContent
        avatarName="User"
        displayName="0xB4F6...cF51"
        signerAddress={SIGNER}
        onSignOut={jest.fn()}
      />,
    )

    expect(screen.queryByTestId('sidebar-profile-wallet-hint')).not.toBeInTheDocument()
  })

  it('renders both sections with distinct identicons when the wallets differ', () => {
    render(
      <ProfilePopoverContent
        avatarName="User"
        displayName="0xB4F6...cF51"
        signerAddress={SIGNER}
        connectedWallet={CONNECTED}
        onSignOut={jest.fn()}
      />,
    )

    const addresses = screen.getAllByTestId('identicon').map((el) => el.getAttribute('data-address'))
    expect(addresses).toEqual([SIGNER, CONNECTED])
  })

  it('shows the connected wallet section for email sign-ins, with the initials avatar kept', () => {
    render(
      <ProfilePopoverContent
        avatarName="alice@safe.global"
        displayName="alice@safe.global"
        connectedWallet={CONNECTED}
        onSignOut={jest.fn()}
      />,
    )

    expect(screen.getByTestId('initials-avatar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile-wallet-hint')).toHaveTextContent('0x481a...Fbc0')
    expect(screen.getAllByTestId('identicon')).toHaveLength(1)
  })

  it('renders the account section when no display name is known yet', () => {
    render(<ProfilePopoverContent avatarName="" displayName="" onSignOut={jest.fn()} />)

    expect(screen.getByText('Your account')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile-sign-out')).toBeInTheDocument()
  })

  it('does not duplicate the Sign out button when the wallet section is shown', () => {
    render(
      <ProfilePopoverContent
        avatarName="User"
        displayName="0xB4F6...cF51"
        signerAddress={SIGNER}
        connectedWallet={CONNECTED}
        onSignOut={jest.fn()}
      />,
    )

    expect(screen.getAllByTestId('sidebar-profile-sign-out')).toHaveLength(1)
  })

  it('calls onSignOut once per click', async () => {
    const onSignOut = jest.fn()

    render(<ProfilePopoverContent avatarName="Alice" displayName="Alice" role="MEMBER" onSignOut={onSignOut} />)

    await userEvent.click(screen.getByTestId('sidebar-profile-sign-out'))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
