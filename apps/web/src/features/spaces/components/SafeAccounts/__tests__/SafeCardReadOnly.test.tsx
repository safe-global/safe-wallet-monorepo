import { render, screen } from '@/tests/test-utils'
import SafeCardReadOnly from '../SafeCardReadOnly'
import type { MultiChainSafeItem } from '@/hooks/safes'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { chainBuilder } from '@/tests/builders/chains'
import type { RootState } from '@/store'
import * as gatewayApi from '@/store/api/gateway'
import * as gatewaySlices from '@/store/slices'

class MockIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
  takeRecords = jest.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

const mockChains = [chainBuilder().with({ chainId: '1', shortName: 'eth', chainName: 'Ethereum' }).build()]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
  useChain: (chainId: string) => mockChains.find((chain) => chain.chainId === chainId),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(() => '0x0000000000000000000000000000000000000000'),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => true),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({ SpaceSafeContextMenu: () => null }),
  createFeatureHandle: () => ({}),
}))

// The shared (space) address book; a test can populate it to assert space-first name resolution.
let mockSpaceContacts: { address: string; name: string; chainIds: string[] }[] = []
jest.mock('@/features/spaces', () => ({
  SpacesFeature: {},
  useGetSpaceAddressBook: () => mockSpaceContacts,
  useCurrentSpaceId: () => undefined,
}))

describe('SafeCardReadOnly', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSpaceContacts = []
    jest
      .spyOn(gatewayApi, 'useGetSafeOverviewQuery')
      .mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() } as never)
    jest
      .spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery')
      .mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() } as never)
    jest.spyOn(gatewaySlices, 'useGetSafeOverviewQuery').mockReturnValue({ data: undefined } as never)
  })

  it('does not render the chip for a deployed safe', () => {
    const safe = safeItemBuilder().with({ chainId: '1', address: '0xDEADBEEF' }).build()

    render(<SafeCardReadOnly safe={safe} />)

    expect(screen.queryByTestId('pending-activation-chip')).toBeNull()
  })

  it('renders the Not activated chip for an undeployed safe', () => {
    const safe = safeItemBuilder().with({ chainId: '1', address: '0xDEADBEEF' }).build()

    render(<SafeCardReadOnly safe={safe} />, {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            '0xDEADBEEF': {
              status: { status: 'AWAITING_EXECUTION' },
              props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
            },
          },
        },
      } as unknown as Partial<RootState>,
    })

    expect(screen.getByTestId('pending-activation-chip')).toBeInTheDocument()
  })

  it('prefers the shared (space) name over a local one when preferSpaceName is set', () => {
    const safe = safeItemBuilder().with({ chainId: '1' }).build()
    mockSpaceContacts = [{ address: safe.address, name: 'Cloud Name', chainIds: ['1'] }]

    render(<SafeCardReadOnly safe={safe} preferSpaceName />, {
      initialReduxState: {
        addressBook: { '1': { [safe.address]: 'Local Name' } },
      } as unknown as Partial<RootState>,
    })

    expect(screen.getByText('Cloud Name')).toBeInTheDocument()
    expect(screen.queryByText('Local Name')).not.toBeInTheDocument()
  })

  it('falls back to the local name when preferSpaceName is set but no space name exists', () => {
    const safe = safeItemBuilder().with({ chainId: '1' }).build()
    mockSpaceContacts = []

    render(<SafeCardReadOnly safe={safe} preferSpaceName />, {
      initialReduxState: {
        addressBook: { '1': { [safe.address]: 'Local Name' } },
      } as unknown as Partial<RootState>,
    })

    expect(screen.getByText('Local Name')).toBeInTheDocument()
  })

  it('finds the shared (space) name on any of a multichain Safe’s chains, not just the first', () => {
    const base = safeItemBuilder().with({ chainId: '1' }).build()
    const multiSafe: MultiChainSafeItem = {
      address: base.address,
      safes: [
        { ...base, chainId: '1' },
        { ...base, chainId: '137' },
      ],
      isPinned: false,
      lastVisited: 0,
      name: undefined,
    }
    // Shared name set only on chain 137 (NOT the first chain).
    mockSpaceContacts = [{ address: base.address, name: 'Cloud Name', chainIds: ['137'] }]

    render(<SafeCardReadOnly safe={multiSafe} preferSpaceName />, {
      initialReduxState: {
        addressBook: { '1': { [base.address]: 'Local Name' } },
      } as unknown as Partial<RootState>,
    })

    expect(screen.getByText('Cloud Name')).toBeInTheDocument()
    expect(screen.queryByText('Local Name')).not.toBeInTheDocument()
  })

  it('uses the local address-book name by default, ignoring the space name (other consumers unchanged)', () => {
    const safe = safeItemBuilder().with({ chainId: '1' }).build()
    mockSpaceContacts = [{ address: safe.address, name: 'Cloud Name', chainIds: ['1'] }]

    render(<SafeCardReadOnly safe={safe} />, {
      initialReduxState: {
        addressBook: { '1': { [safe.address]: 'Local Name' } },
      } as unknown as Partial<RootState>,
    })

    expect(screen.getByText('Local Name')).toBeInTheDocument()
    expect(screen.queryByText('Cloud Name')).not.toBeInTheDocument()
  })

  it('renders the Not activated chip in place of the balance for an undeployed safe', () => {
    const safe = safeItemBuilder().with({ chainId: '1', address: '0xDEADBEEF' }).build()

    render(<SafeCardReadOnly safe={safe} />, {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            '0xDEADBEEF': {
              status: { status: 'AWAITING_EXECUTION' },
              props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
            },
          },
        },
      } as unknown as Partial<RootState>,
    })

    const chip = screen.getByTestId('pending-activation-chip')

    const balanceColumn = screen.getByTestId('balance-column')
    expect(balanceColumn.contains(chip)).toBe(true)
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })
})
