import { renderHook } from '@/tests/test-utils'
import { useSafeItemData } from '../useSafeItemData'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { chainBuilder } from '@/tests/builders/chains'
import { OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import type { RootState } from '@/store'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import * as slices from '@/store/slices'

const mockChain = chainBuilder().with({ chainId: '1' }).build()

jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(() => mockChain),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(() => '0x0000000000000000000000000000000000000000'),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}))

jest.mock('@/hooks/useOnceVisible', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

jest.mock('@/hooks/safes', () => ({
  useGetHref: jest.fn(() => (chain: Chain, address: string) => `/${chain.shortName}:${address}`),
}))

describe('useSafeItemData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(slices, 'useGetSafeOverviewQuery').mockReturnValue({ data: undefined } as never)
  })

  describe('isCurrentSafe detection', () => {
    it('should return isCurrentSafe=true when chainId and address match', () => {
      const safeItem = safeItemBuilder()
        .with({ chainId: '1', address: '0x0000000000000000000000000000000000000000' })
        .build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.isCurrentSafe).toBe(true)
    })

    it('should return isCurrentSafe=false when chainId does not match', () => {
      const safeItem = safeItemBuilder()
        .with({ chainId: '137', address: '0x0000000000000000000000000000000000000000' })
        .build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.isCurrentSafe).toBe(false)
    })

    it('should return isCurrentSafe=false when address does not match', () => {
      const safeItem = safeItemBuilder()
        .with({ chainId: '1', address: '0x1111111111111111111111111111111111111111' })
        .build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.isCurrentSafe).toBe(false)
    })
  })

  describe('activation status', () => {
    it('should return isActivating=false when there is no undeployed safe', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.isActivating).toBe(false)
    })

    it('should return isActivating=false for undeployed safe with AWAITING_EXECUTION status', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xabc123' }).build()

      const { result } = renderHook(() => useSafeItemData(safeItem), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xabc123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isActivating).toBe(false)
    })

    it('should return isActivating=true for undeployed safe with non-AWAITING_EXECUTION status', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xdef456' }).build()

      const { result } = renderHook(() => useSafeItemData(safeItem), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xdef456': {
                status: { status: 'PROCESSING' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isActivating).toBe(true)
    })
  })

  describe('tracking labels', () => {
    it('should return sidebar tracking label by default', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.trackingLabel).toBe(OVERVIEW_LABELS.sidebar)
    })

    it('should return space_page tracking label when isSpaceSafe is true', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem, { isSpaceSafe: true }))

      expect(result.current.trackingLabel).toBe(OVERVIEW_LABELS.space_page)
    })

    it('should return login_page tracking label on welcome page', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem), {
        routerProps: { pathname: AppRoutes.welcome.accounts },
      })

      expect(result.current.trackingLabel).toBe(OVERVIEW_LABELS.login_page)
    })

    it('should prioritize login_page over space_page when on welcome page', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem, { isSpaceSafe: true }), {
        routerProps: { pathname: AppRoutes.welcome.accounts },
      })

      expect(result.current.trackingLabel).toBe(OVERVIEW_LABELS.login_page)
    })
  })

  describe('data derivation', () => {
    it('should use provided safeOverview when available', () => {
      const safeItem = safeItemBuilder().build()
      const mockOverview = {
        address: { value: safeItem.address },
        threshold: 3,
        owners: [{ value: '0x111' }, { value: '0x222' }, { value: '0x333' }],
      }

      const { result } = renderHook(() => useSafeItemData(safeItem, { safeOverview: mockOverview as never }))

      expect(result.current.threshold).toBe(3)
      expect(result.current.owners).toHaveLength(3)
    })

    it('should derive threshold and owners from counterfactual setup for undeployed safes', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xundeployed' }).build()

      const { result } = renderHook(() => useSafeItemData(safeItem), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xundeployed': {
                status: { status: 'AWAITING_EXECUTION' },
                props: {
                  safeAccountConfig: {
                    owners: ['0xowner1', '0xowner2'],
                    threshold: 2,
                  },
                },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.threshold).toBe(2)
      expect(result.current.owners).toEqual([{ value: '0xowner1' }, { value: '0xowner2' }])
    })

    it('should use default values when no overview or counterfactual data is available', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      // Default values from defaultSafeInfo
      expect(result.current.threshold).toBeDefined()
      expect(result.current.owners).toBeDefined()
    })

    it('should return name from address book', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xnamed' }).build()

      const { result } = renderHook(() => useSafeItemData(safeItem), {
        initialReduxState: {
          addressBook: {
            '1': {
              '0xnamed': 'My Named Safe',
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.name).toBe('My Named Safe')
    })

    it('should generate correct href', () => {
      const safeItem = safeItemBuilder().with({ address: '0xhref123' }).build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.href).toContain('0xhref123')
    })
  })

  describe('visibility tracking', () => {
    it('should provide elementRef for visibility tracking', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.elementRef).toBeDefined()
      expect(result.current.elementRef.current).toBeNull()
    })

    it('should return isVisible state', () => {
      const safeItem = safeItemBuilder().build()

      const { result } = renderHook(() => useSafeItemData(safeItem))

      expect(result.current.isVisible).toBe(true)
    })
  })
})
