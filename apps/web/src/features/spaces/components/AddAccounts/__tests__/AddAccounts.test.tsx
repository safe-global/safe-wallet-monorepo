import { render, screen } from '@/tests/test-utils'
import AddAccounts from '../index'

jest.mock('../../Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 10,
}))

jest.mock('../../SelectSafesOnboarding/components/OnboardingSafesList', () => ({
  __esModule: true,
  default: (props: { trustedSafes: unknown[]; ownedSafes: unknown[] }) => (
    <div
      data-testid="onboarding-safes-list"
      data-trusted-count={props.trustedSafes.length}
      data-owned-count={props.ownedSafes.length}
    />
  ),
}))

jest.mock('../AddManually', () => ({
  __esModule: true,
  default: () => <div data-testid="add-manually" />,
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="modal-dialog">{children}</div> : null,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

let mockWalletValue: { address: string } | null = { address: '0xWallet' }
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' }] }),
}))

let mockAllOwned: Record<string, string[]> = {}
jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return {
    ...actual,
    useAllOwnedSafes: () => [mockAllOwned, false] as const,
    useSafesSearch: (safes: unknown) => safes,
  }
})

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => true,
  useSpaceSafes: () => ({ allSafes: [] }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [jest.fn(), {}],
  useSpaceSafesDeleteV1Mutation: () => [jest.fn(), {}],
}))

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

describe('AddAccounts — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
  })

  it('does not render ConnectWalletPrompt when a wallet is connected', () => {
    mockWalletValue = { address: '0xWallet' }
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.queryByTestId('add-accounts-connect-wallet-button')).not.toBeInTheDocument()
  })

  it('renders ConnectWalletPrompt when no wallet is connected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.getByTestId('add-accounts-connect-wallet-button')).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet to access all your Safes')).toBeInTheDocument()
  })

  it('replaces the safes list with the ConnectWalletPrompt when wallet is disconnected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.queryByTestId('add-accounts-safes-list-scroll-region')).not.toBeInTheDocument()
    expect(screen.queryByTestId('onboarding-safes-list')).not.toBeInTheDocument()
    expect(screen.getByTestId('add-accounts-connect-wallet-button')).toBeInTheDocument()
  })

  it('does not show the "No safes on your list" empty state when wallet is disconnected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.queryByText('No safes on your list')).not.toBeInTheDocument()
  })
})
