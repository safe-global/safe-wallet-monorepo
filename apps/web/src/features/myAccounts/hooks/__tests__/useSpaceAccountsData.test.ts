import { renderHook } from '@/tests/test-utils'
import useSpaceAccountsData from '../useSpaceAccountsData'
import { chainBuilder } from '@/tests/builders/chains'
import type { RootState } from '@/store'
import type { SafeItem, AllSafeItems } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as gatewayApi from '@/store/api/gateway'

const mockChains = [
  chainBuilder().with({ chainId: '1', shortName: 'eth' }).build(),
  chainBuilder().with({ chainId: '137', shortName: 'matic' }).build(),
]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890123456789012345678901234567890' })),
}))

const makeSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0xSafeAddress',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

describe('useSpaceAccountsData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({
      data: undefined,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
    } as never)
  })

  describe('CF owners fallback', () => {
    it('should use owners from undeployed safe when no SafeOverview is available', () => {
      const address = '0xCfSafeAddress'
      const safes: AllSafeItems = [makeSafeItem({ chainId: '1', address })]

      const { result } = renderHook(() => useSpaceAccountsData(safes), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              [address]: {
                props: {
                  safeAccountConfig: {
                    threshold: 1,
                    owners: ['0xOwnerA', '0xOwnerB'],
                  },
                  factoryAddress: '0xFactory',
                  masterCopy: '0xMasterCopy',
                  saltNonce: '0',
                  safeVersion: '1.3.0',
                },
                status: { status: 'AWAITING_EXECUTION', type: 'counterfactual' },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.accounts).toHaveLength(1)
      expect(result.current.accounts[0].owners).toBe('1/2')
    })

    it('should use owners from SafeOverview when available', () => {
      const address = '0xDeployedSafe'

      const mockOverview: Partial<SafeOverview> = {
        address: { value: address },
        chainId: '1',
        threshold: 3,
        owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }, { value: '0xOwner3' }],
        fiatTotal: '1000',
      }

      jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({
        data: [mockOverview] as SafeOverview[],
        isFetching: false,
        error: undefined,
        refetch: jest.fn(),
      } as never)

      const safes: AllSafeItems = [makeSafeItem({ chainId: '1', address })]

      // Also provide undeployed safe data to verify it is NOT used
      const { result } = renderHook(() => useSpaceAccountsData(safes), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              [address]: {
                props: {
                  safeAccountConfig: {
                    threshold: 1,
                    owners: ['0xOwnerA'],
                  },
                  factoryAddress: '0xFactory',
                  masterCopy: '0xMasterCopy',
                  saltNonce: '0',
                  safeVersion: '1.3.0',
                },
                status: { status: 'AWAITING_EXECUTION', type: 'counterfactual' },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.accounts).toHaveLength(1)
      expect(result.current.accounts[0].owners).toBe('3/3')
    })

    it('should return empty string for owners when neither overview nor CF data is available', () => {
      const safes: AllSafeItems = [makeSafeItem({ chainId: '1', address: '0xNoData' })]

      const { result } = renderHook(() => useSpaceAccountsData(safes))

      expect(result.current.accounts).toHaveLength(1)
      expect(result.current.accounts[0].owners).toBe('')
    })

    it('should use CF owners for multichain safe when no overview is available', () => {
      const address = '0xMultiCfSafe'
      const safes: AllSafeItems = [
        {
          address,
          safes: [makeSafeItem({ chainId: '1', address }), makeSafeItem({ chainId: '137', address })],
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        },
      ]

      const { result } = renderHook(() => useSpaceAccountsData(safes), {
        initialReduxState: {
          undeployedSafes: {
            '1': {
              [address]: {
                props: {
                  safeAccountConfig: {
                    threshold: 2,
                    owners: ['0xOwnerA', '0xOwnerB', '0xOwnerC'],
                  },
                  factoryAddress: '0xFactory',
                  masterCopy: '0xMasterCopy',
                  saltNonce: '0',
                  safeVersion: '1.3.0',
                },
                status: { status: 'AWAITING_EXECUTION', type: 'counterfactual' },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.accounts).toHaveLength(1)
      expect(result.current.accounts[0].owners).toBe('2/3')
    })

    it('finds CF owners when the CF entry is on a chain other than safe.safes[0]', () => {
      // Regression: previously only `safe.safes[0].chainId` was consulted, so a
      // group whose CF entry lived on a later chain in the array rendered as
      // owners='' even though the data was present.
      const address = '0xMultiCfOnSecondChain'
      const safes: AllSafeItems = [
        {
          address,
          safes: [makeSafeItem({ chainId: '1', address }), makeSafeItem({ chainId: '137', address })],
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        },
      ]

      const { result } = renderHook(() => useSpaceAccountsData(safes), {
        initialReduxState: {
          undeployedSafes: {
            // No entry on chain '1' — only on '137' (index 1 in safe.safes).
            '137': {
              [address]: {
                props: {
                  safeAccountConfig: {
                    threshold: 2,
                    owners: ['0xOwnerA', '0xOwnerB', '0xOwnerC', '0xOwnerD'],
                  },
                  factoryAddress: '0xFactory',
                  masterCopy: '0xMasterCopy',
                  saltNonce: '0',
                  safeVersion: '1.3.0',
                },
                status: { status: 'AWAITING_EXECUTION', type: 'counterfactual' },
              },
            },
          },
        } as unknown as Partial<RootState>,
      })

      expect(result.current.accounts).toHaveLength(1)
      expect(result.current.accounts[0].owners).toBe('2/4')
    })
  })
})
