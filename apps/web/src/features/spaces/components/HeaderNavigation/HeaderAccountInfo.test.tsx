import { render, screen } from '@testing-library/react'
import HeaderAccountInfo from './HeaderAccountInfo'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'

jest.mock('@/hooks/useIsSignedIn', () => ({ useIsSignedIn: jest.fn() }))

jest.mock('../../hooks/useSpaceMembers', () => ({
  useCurrentMemberProfile: () => ({
    membership: undefined,
    signerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    email: undefined,
    isLoading: false,
  }),
}))

jest.mock('../SpacesList/AccountInfo', () => ({
  AccountInfo: ({ profileName, displayName }: { profileName: string; displayName: string }) => (
    <div data-testid="account-info" data-profile={profileName} data-display={displayName} />
  ),
}))

const mockUseIsSignedIn = useIsSignedIn as jest.Mock

describe('HeaderAccountInfo', () => {
  it('renders the round account icon when the user is signed in to a space account', () => {
    mockUseIsSignedIn.mockReturnValue(true)

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('header-account-info')).toBeInTheDocument()
    expect(screen.getByTestId('account-info')).toBeInTheDocument()
  })

  it('renders nothing when the user is not signed in', () => {
    mockUseIsSignedIn.mockReturnValue(false)

    render(<HeaderAccountInfo />)

    expect(screen.queryByTestId('header-account-info')).not.toBeInTheDocument()
  })
})
