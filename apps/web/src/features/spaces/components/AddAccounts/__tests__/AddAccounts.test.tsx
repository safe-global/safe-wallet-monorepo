import { act, fireEvent, render, screen } from '@/tests/test-utils'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import AddAccounts from '../index'

// jsdom doesn't implement ResizeObserver; the list region uses one to detect
// whether the safe list overflows (which gates the bottom fade gradient).
let resizeCallback: ResizeObserverCallback | undefined
class ResizeObserverStub {
  constructor(cb: ResizeObserverCallback) {
    resizeCallback = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub

const setListOverflow = (overflow: boolean) => {
  const region = screen.getByTestId('add-accounts-safes-list-region')
  Object.defineProperty(region, 'scrollHeight', { configurable: true, value: overflow ? 1000 : 100 })
  Object.defineProperty(region, 'clientHeight', { configurable: true, value: 100 })
  act(() => {
    resizeCallback?.([], {} as ResizeObserver)
  })
}

jest.mock('@/features/spaces/constants', () => ({
  ...jest.requireActual('@/features/spaces/constants'),
  SAFE_ACCOUNTS_LIMIT: 10,
}))

jest.mock('../../SelectSafesOnboarding/components/OnboardingSafesList', () => ({
  __esModule: true,
  default: (props: { trustedSafes: unknown[]; ownedSafes: unknown[]; similarAddresses?: Set<string> }) => (
    <div
      data-testid="onboarding-safes-list"
      data-trusted-count={props.trustedSafes.length}
      data-owned-count={props.ownedSafes.length}
      data-similar={[...(props.similarAddresses ?? [])].sort().join(',')}
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

let mockChainIds = ['1']
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChainIds.map((chainId) => ({ chainId })) }),
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

let mockIsAdmin = true
let mockSpaceSafes: Array<{ chainId: string; address: string }> = []
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
  useSpaceSafes: () => ({ allSafes: mockSpaceSafes }),
}))

let mockListSimilarities = new Map<string, ListAnnotation>()
jest.mock('@/features/address-poisoning', () => ({
  useListSimilarities: () => mockListSimilarities,
}))

const mockAddSafesToSpace = jest.fn()
const mockRemoveSafesFromSpace = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafesToSpace, {}],
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafesFromSpace, {}],
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
    mockIsAdmin = true
    mockSpaceSafes = []
  })

  it('does not render the connect-wallet hint when a wallet is connected', () => {
    mockWalletValue = { address: '0xWallet' }
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.queryByTestId('add-accounts-connect-wallet-button')).not.toBeInTheDocument()
  })

  it('renders an inline connect-wallet hint when no wallet is connected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.getByTestId('add-accounts-connect-wallet-button')).toBeInTheDocument()
  })

  it('clicking the connect-wallet hint triggers wallet connection', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    fireEvent.click(screen.getByTestId('add-accounts-connect-wallet-button'))
    expect(mockConnectWallet).toHaveBeenCalled()
  })

  it('still renders the safes list (does not replace it) when no wallet is connected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: { '1': { '0x0000000000000000000000000000000000001234': { owners: [], threshold: 1 } } },
      },
    })

    // List region is present AND the list actually renders — not replaced by a connect prompt.
    expect(screen.getByTestId('add-accounts-safes-list-region')).toBeInTheDocument()
    expect(screen.getByTestId('onboarding-safes-list')).toBeInTheDocument()
  })

  it('keeps the manual add affordance available without a connected wallet', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    expect(screen.getByTestId('add-manually')).toBeInTheDocument()
  })

  it('shows locally stored (trusted) safes even without a connected wallet', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0x0000000000000000000000000000000000001234': { owners: [], threshold: 1 },
          },
        },
      },
    })

    expect(screen.getByTestId('onboarding-safes-list')).toHaveAttribute('data-trusted-count', '1')
  })

  it('excludes safes already in the current space, even without a connected wallet', () => {
    mockWalletValue = null
    const address = '0x0000000000000000000000000000000000001234'
    // The same safe is both locally stored and already part of the current space.
    mockSpaceSafes = [{ chainId: '1', address }]
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: { '1': { [address]: { owners: [], threshold: 1 } } },
      },
    })

    // Its only saved safe is in the space → filtered out → list is empty (contrast with the test above).
    expect(screen.queryByTestId('onboarding-safes-list')).not.toBeInTheDocument()
  })
})

describe('AddAccounts — address-poisoning (Mode B)', () => {
  const anchor = '0x1111111111111111111111111111111111111111'
  const impostor = '0x2222222222222222222222222222222222222222'

  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockIsAdmin = true
    mockSpaceSafes = []
    mockChainIds = ['1']
    mockListSimilarities = new Map()
  })

  it('flags both the impostor and the trusted anchor it imitates', () => {
    // anchor is pinned (trusted); impostor is owned. useListSimilarities reports the
    // impostor resembling the anchor — both must end up in similarAddresses so the pair
    // reads side by side.
    mockAllOwned = { '1': [impostor] }
    mockListSimilarities = new Map([
      [impostor.toLowerCase(), { address: impostor, match: { anchor: normalizeAddress(anchor) } as never }],
    ])

    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: { '1': { [anchor]: { owners: [], threshold: 1 } } },
      },
    })

    const flagged = screen.getByTestId('onboarding-safes-list').getAttribute('data-similar')?.split(',') ?? []
    expect(flagged).toContain(impostor.toLowerCase())
    expect(flagged).toContain(anchor.toLowerCase())
  })

  it('does not flag anything when useListSimilarities reports no matches', () => {
    mockAllOwned = { '1': [impostor] }
    mockListSimilarities = new Map()

    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: { '1': { [anchor]: { owners: [], threshold: 1 } } },
      },
    })

    expect(screen.getByTestId('onboarding-safes-list')).toHaveAttribute('data-similar', '')
  })

  it('keeps a multichain Safe (pinned on one chain, owned on another) whole in trusted', () => {
    // Option C: address-level trust. The same address pinned on chain 1 and owned on chain 137
    // must appear once in trusted (grouped), never split into the owned section.
    mockChainIds = ['1', '137']
    mockAllOwned = { '137': [anchor] }

    render(<AddAccounts externalOpen onExternalClose={() => {}} />, {
      initialReduxState: {
        addedSafes: { '1': { [anchor]: { owners: [], threshold: 1 } } },
      },
    })

    const list = screen.getByTestId('onboarding-safes-list')
    expect(list).toHaveAttribute('data-trusted-count', '1')
    expect(list).toHaveAttribute('data-owned-count', '0')
  })
})

describe('AddAccounts — admin guard on submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockChainIds = ['1']
    mockListSimilarities = new Map()
  })

  it('blocks submission and shows an error when the user is not an admin', async () => {
    mockIsAdmin = false
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(await screen.findByText('Only admins can add or remove Safe accounts in this workspace')).toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })

  it('disables the trigger button when the user is not an admin', () => {
    mockIsAdmin = false
    render(<AddAccounts />)

    expect(screen.getByTestId('add-space-account-button')).toBeDisabled()
  })

  it('enables the trigger button when the user is an admin', () => {
    mockIsAdmin = true
    render(<AddAccounts />)

    expect(screen.getByTestId('add-space-account-button')).not.toBeDisabled()
  })

  it('does not show the admin error and does not call mutations when an admin submits an empty form', async () => {
    mockIsAdmin = true
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    // Admin path: no admin-block error; nothing to add/remove → no mutations either
    expect(screen.queryByText('Only admins can add or remove Safe accounts in this workspace')).not.toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })
})

describe('AddAccounts — list fade gradient', () => {
  const withSafe = {
    initialReduxState: {
      addedSafes: { '1': { '0x0000000000000000000000000000000000001234': { owners: [], threshold: 1 } } },
    },
  }

  beforeEach(() => {
    resizeCallback = undefined
    mockWalletValue = { address: '0xWallet' }
    mockIsAdmin = true
    mockSpaceSafes = []
    mockChainIds = ['1']
    mockListSimilarities = new Map()
  })

  it('hides the fade when the list does not overflow', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withSafe)

    setListOverflow(false)

    expect(screen.queryByTestId('add-accounts-list-fade')).not.toBeInTheDocument()
  })

  it('shows the fade when the list overflows', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withSafe)

    setListOverflow(true)

    expect(screen.getByTestId('add-accounts-list-fade')).toBeInTheDocument()
  })
})
