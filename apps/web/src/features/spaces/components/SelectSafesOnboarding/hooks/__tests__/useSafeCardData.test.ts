import { renderHook } from '@/tests/test-utils'
import useSafeCardData from '../useSafeCardData'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { chainBuilder } from '@/tests/builders/chains'
import type { RootState } from '@/store'
import type { MultiChainSafeItem } from '@/hooks/safes'
import * as gatewayApi from '@/store/api/gateway'
import * as gatewaySlices from '@/store/slices'

const mockChains = [
  chainBuilder().with({ chainId: '1', shortName: 'eth' }).build(),
  chainBuilder().with({ chainId: '137', shortName: 'matic' }).build(),
]

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
  default: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(() => false),
}))

describe('useSafeCardData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({ data: undefined } as never)
    jest.spyOn(gatewaySlices, 'useGetSafeOverviewQuery').mockReturnValue({ data: undefined } as never)
  })

  describe('single-chain safe', () => {
    it('returns isUndeployed=false when the safe has no undeployed record', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xABC123' }).build()

      const { result } = renderHook(() => useSafeCardData(safeItem))

      expect(result.current.isUndeployed).toBe(false)
      expect(result.current.isActivating).toBe(false)
    })

    it('returns isUndeployed=true when the safe is in the undeployed store', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xABC123' }).build()

      const { result } = renderHook(() => useSafeCardData(safeItem), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xABC123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isUndeployed).toBe(true)
      expect(result.current.isActivating).toBe(false)
    })

    it('returns isActivating=true when the single safe status is not AWAITING_EXECUTION', () => {
      const safeItem = safeItemBuilder().with({ chainId: '1', address: '0xABC123' }).build()

      const { result } = renderHook(() => useSafeCardData(safeItem), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xABC123': {
                status: { status: 'PROCESSING' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isUndeployed).toBe(true)
      expect(result.current.isActivating).toBe(true)
    })
  })

  describe('multi-chain safe', () => {
    const buildMulti = (): MultiChainSafeItem => ({
      address: '0xABC123',
      safes: [
        safeItemBuilder().with({ chainId: '1', address: '0xABC123' }).build(),
        safeItemBuilder().with({ chainId: '137', address: '0xABC123' }).build(),
      ],
      isPinned: false,
      lastVisited: 0,
      name: 'Multi',
    })

    it('returns isUndeployed=true only when every chain is undeployed', () => {
      const { result } = renderHook(() => useSafeCardData(buildMulti()), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xABC123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
            '137': {
              '0xABC123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isUndeployed).toBe(true)
    })

    it('returns isUndeployed=false when at least one chain is deployed', () => {
      const { result } = renderHook(() => useSafeCardData(buildMulti()), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              '0xABC123': {
                status: { status: 'AWAITING_EXECUTION' },
                props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.isUndeployed).toBe(false)
    })
  })
})
