import { render, screen } from '@testing-library/react'
import HeaderAccountInfo from './HeaderAccountInfo'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import useWallet from '@/hooks/wallets/useWallet'

const SIGNER = '0x1234567890abcdef1234567890abcdef12345678'
const OTHER_WALLET = '0x481a000000000000000000000000000000000bFb'

jest.mock('@/hooks/useIsSignedIn', () => ({ useIsSignedIn: jest.fn() }))

jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))

const mockProfile = jest.fn()
// Keep the real MemberRole/MemberStatus enums; the component compares against them.
jest.mock('../../hooks/useSpaceMembers', () => ({
  ...jest.requireActual('../../hooks/useSpaceMembers'),
  useCurrentMemberProfile: () => mockProfile(),
}))

jest.mock('../SpacesList/AccountInfo', () => ({
  AccountInfo: ({
    profileName,
    displayName,
    signerAddress,
    connectedWallet,
    isMember,
  }: {
    profileName: string
    displayName: string
    signerAddress?: string
    connectedWallet?: string
    isMember?: boolean
  }) => (
    <div
      data-testid="account-info"
      data-profile={profileName}
      data-display={displayName}
      data-signer={signerAddress ?? ''}
      data-connected={connectedWallet ?? ''}
      data-is-member={String(Boolean(isMember))}
    />
  ),
}))

const mockUseIsSignedIn = useIsSignedIn as jest.Mock
const mockUseWallet = useWallet as jest.Mock

describe('HeaderAccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSignedIn.mockReturnValue(true)
    mockUseWallet.mockReturnValue(null)
    mockProfile.mockReturnValue({
      membership: undefined,
      signerAddress: SIGNER,
      email: undefined,
      isLoading: false,
    })
  })

  it('renders the round account icon when the user is signed in to a space account', () => {
    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('header-account-info')).toBeInTheDocument()
    expect(screen.getByTestId('account-info')).toBeInTheDocument()
  })

  it('renders nothing when the user is not signed in', () => {
    mockUseIsSignedIn.mockReturnValue(false)

    render(<HeaderAccountInfo />)

    expect(screen.queryByTestId('header-account-info')).not.toBeInTheDocument()
  })

  it('passes the connected wallet on when it differs from the signed-in signer', () => {
    mockUseWallet.mockReturnValue({ address: OTHER_WALLET })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-connected', OTHER_WALLET)
  })

  it('withholds the connected wallet when it is the signed-in signer', () => {
    mockUseWallet.mockReturnValue({ address: SIGNER })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-connected', '')
  })

  it('withholds the connected wallet when it matches the signer in a different case', () => {
    mockUseWallet.mockReturnValue({ address: SIGNER.toUpperCase().replace('0X', '0x') })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-connected', '')
  })

  it('passes the signer address through for wallet sign-ins', () => {
    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-signer', SIGNER)
  })

  it('withholds the connected wallet when no wallet is connected', () => {
    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-connected', '')
  })

  it('withholds the display name and connected wallet while the session is loading', () => {
    mockProfile.mockReturnValue({
      membership: undefined,
      signerAddress: undefined,
      email: undefined,
      isLoading: true,
    })
    mockUseWallet.mockReturnValue({ address: SIGNER })

    render(<HeaderAccountInfo />)

    const accountInfo = screen.getByTestId('account-info')
    expect(accountInfo).toHaveAttribute('data-display', '')
    expect(accountInfo).toHaveAttribute('data-connected', '')
  })

  it('withholds the connected wallet when neither a signer nor an email is known', () => {
    mockProfile.mockReturnValue({
      membership: undefined,
      signerAddress: undefined,
      email: undefined,
      isLoading: false,
    })
    mockUseWallet.mockReturnValue({ address: OTHER_WALLET })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-connected', '')
  })

  it('marks an active member so the popover shows the membership caption', () => {
    mockProfile.mockReturnValue({
      membership: { status: 'ACTIVE', role: 'MEMBER' },
      signerAddress: SIGNER,
      email: undefined,
      isLoading: false,
    })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-is-member', 'true')
  })

  it('does not mark an admin as a member', () => {
    mockProfile.mockReturnValue({
      membership: { status: 'ACTIVE', role: 'ADMIN' },
      signerAddress: SIGNER,
      email: undefined,
      isLoading: false,
    })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-is-member', 'false')
  })

  it('does not mark an invited member as a member until they accept', () => {
    mockProfile.mockReturnValue({
      membership: { status: 'INVITED', role: 'MEMBER' },
      signerAddress: SIGNER,
      email: undefined,
      isLoading: false,
    })

    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-is-member', 'false')
  })

  it('does not mark a user without a workspace as a member', () => {
    render(<HeaderAccountInfo />)

    expect(screen.getByTestId('account-info')).toHaveAttribute('data-is-member', 'false')
  })

  it('withholds the signer address and connected wallet for email sign-ins', () => {
    mockProfile.mockReturnValue({
      membership: undefined,
      signerAddress: undefined,
      email: 'alice@safe.global',
      isLoading: false,
    })
    mockUseWallet.mockReturnValue({ address: OTHER_WALLET })

    render(<HeaderAccountInfo />)

    const accountInfo = screen.getByTestId('account-info')
    expect(accountInfo).toHaveAttribute('data-signer', '')
    expect(accountInfo).toHaveAttribute('data-display', 'alice@safe.global')
    expect(accountInfo).toHaveAttribute('data-connected', '')
  })
})
