import { render, screen } from '@/tests/test-utils'
import SafeCardReadOnly from '../SafeCardReadOnly'
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

jest.mock('@/features/spaces', () => ({
  SpacesFeature: {},
  useGetSpaceAddressBook: () => [],
  useGetPrivateAddressBook: () => [],
  useCurrentSpaceId: () => undefined,
}))

describe('SafeCardReadOnly', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(gatewayApi, 'useGetSafeOverviewQuery')
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
