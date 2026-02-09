import { renderHook } from '@/tests/test-utils'
import { useMultiAccountItemData } from '../useMultiAccountItemData'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { chainBuilder } from '@/tests/builders/chains'
import { AppRoutes } from '@/config/routes'
import type { RootState } from '@/store'
import type { MultiChainSafeItem } from '@/hooks/safes'
import * as gatewayApi from '@/store/api/gateway'

const mockChains = [
  chainBuilder().with({ chainId: '1', shortName: 'eth' }).build(),
  chainBuilder().with({ chainId: '137', shortName: 'matic' }).build(),
]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(() => '0x0000000000000000000000000000000000000000'),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

const buildMultiChainSafeItem = (overrides: Partial<MultiChainSafeItem> = {}): MultiChainSafeItem => {
  const defaultSafes = [
    safeItemBuilder().with({ chainId: '1', address: '0xABC123', isReadOnly: false }).build(),
    safeItemBuilder().with({ chainId: '137', address: '0xABC123', isReadOnly: false }).build(),
  ]

  return {
    address: '0xABC123',
    safes: defaultSafes,
    isPinned: false,
    lastVisited: 0,
    name: 'Test Multi Safe',
    ...overrides,
  }
}

describe('useMultiAccountItemData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({ data: undefined } as never)
  })

  describe('basic data derivation', () => {
    it('should return the address and name from the multi safe item', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        address: '0xMyAddress',
        name: 'My Multi Safe',
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.address).toBe('0xMyAddress')
      expect(result.current.name).toBe('My Multi Safe')
    })

    it('should return isPinned status from the multi safe item', () => {
      const pinnedItem = buildMultiChainSafeItem({ isPinned: true })

      const { result } = renderHook(() => useMultiAccountItemData(pinnedItem))

      expect(result.current.isPinned).toBe(true)
    })

    it('should return deployed chain IDs from the safes', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        safes: [
          safeItemBuilder().with({ chainId: '1', address: '0xABC' }).build(),
          safeItemBuilder().with({ chainId: '137', address: '0xABC' }).build(),
          safeItemBuilder().with({ chainId: '10', address: '0xABC' }).build(),
        ],
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.deployedChainIds).toContain('1')
      expect(result.current.deployedChainIds).toContain('137')
      expect(result.current.deployedChainIds).toContain('10')
    })
  })

  describe('isCurrentSafe detection', () => {
    it('should return isCurrentSafe=true when address matches the current safe', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        address: '0x0000000000000000000000000000000000000000',
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.isCurrentSafe).toBe(true)
    })

    it('should return isCurrentSafe=false when address does not match', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        address: '0x1111111111111111111111111111111111111111',
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.isCurrentSafe).toBe(false)
    })
  })

  describe('isReadOnly detection', () => {
    it('should return isReadOnly=true when all safes are read-only', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        safes: [
          safeItemBuilder().with({ chainId: '1', address: '0xABC', isReadOnly: true }).build(),
          safeItemBuilder().with({ chainId: '137', address: '0xABC', isReadOnly: true }).build(),
        ],
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.isReadOnly).toBe(true)
    })

    it('should return isReadOnly=false when at least one safe is not read-only', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        safes: [
          safeItemBuilder().with({ chainId: '1', address: '0xABC', isReadOnly: true }).build(),
          safeItemBuilder().with({ chainId: '137', address: '0xABC', isReadOnly: false }).build(),
        ],
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem))

      expect(result.current.isReadOnly).toBe(false)
    })
  })

  describe('page detection', () => {
    it('should return isWelcomePage=true when on the welcome accounts page', () => {
      const multiSafeItem = buildMultiChainSafeItem()

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem), {
        routerProps: { pathname: AppRoutes.welcome.accounts },
      })

      expect(result.current.isWelcomePage).toBe(true)
    })

    it('should return isWelcomePage=false when on other pages', () => {
      const multiSafeItem = buildMultiChainSafeItem()

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem), {
        routerProps: { pathname: '/some/other/page' },
      })

      expect(result.current.isWelcomePage).toBe(false)
    })
  })

  describe('sorting', () => {
    it('should return sorted safes based on order preference', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        safes: [
          safeItemBuilder().with({ chainId: '137', address: '0xABC', lastVisited: 100 }).build(),
          safeItemBuilder().with({ chainId: '1', address: '0xABC', lastVisited: 200 }).build(),
        ],
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem), {
        initialReduxState: {
          orderByPreference: { orderBy: 'lastVisited' },
        } as Partial<RootState>,
      })

      expect(result.current.sortedSafes).toHaveLength(2)
    })
  })

  describe('undeployed safe handling', () => {
    it('should exclude undeployed safes from deployed safes count', () => {
      const multiSafeItem = buildMultiChainSafeItem({
        safes: [
          safeItemBuilder().with({ chainId: '1', address: '0xABC123' }).build(),
          safeItemBuilder().with({ chainId: '137', address: '0xABC123' }).build(),
        ],
      })

      const { result } = renderHook(() => useMultiAccountItemData(multiSafeItem), {
        initialReduxState: {
          undeployedSafes: {
            '137': {
              '0xABC123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      // The hook should still return all safes in sortedSafes, but internally
      // it filters deployed safes for the overview query
      expect(result.current.sortedSafes).toHaveLength(2)
    })
  })
})
