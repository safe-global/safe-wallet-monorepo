import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { renderHook } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import type { RootState } from '@/store'
import * as gateway from '@/store/api/gateway'
import { useRowOverviews } from '../useRowOverviews'

const mockIsVisible = jest.fn(() => true)

jest.mock('@/hooks/useOnceVisible', () => ({
  __esModule: true,
  default: () => mockIsVisible(),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => ({ address: '0x1234567890123456789012345678901234567890' }),
}))

const overview = (chainId: string, address: string): SafeOverview =>
  ({ chainId, address: { value: address }, fiatTotal: '100' }) as SafeOverview

describe('useRowOverviews', () => {
  let querySpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsVisible.mockReturnValue(true)
    querySpy = jest.spyOn(gateway, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({ data: undefined } as never)
  })

  it('fetches the row overviews once visible and reports them up', () => {
    const data = [overview('1', '0xabc')]
    querySpy.mockReturnValue({ data } as never)
    const onLoaded = jest.fn()
    const safes = [safeItemBuilder().with({ chainId: '1', address: '0xabc' }).build()]

    renderHook(() => useRowOverviews(safes, true, onLoaded))

    expect(querySpy).toHaveBeenCalledWith(expect.objectContaining({ safes }))
    expect(onLoaded).toHaveBeenCalledWith(data)
  })

  it('does not fetch until the row is visible', () => {
    mockIsVisible.mockReturnValue(false)
    const onLoaded = jest.fn()

    renderHook(() => useRowOverviews([safeItemBuilder().build()], true, onLoaded))

    expect(querySpy).toHaveBeenCalledWith(skipToken)
    expect(onLoaded).not.toHaveBeenCalled()
  })

  it('does not fetch for a disabled (child) row', () => {
    const onLoaded = jest.fn()

    renderHook(() => useRowOverviews([safeItemBuilder().build()], false, onLoaded))

    expect(querySpy).toHaveBeenCalledWith(skipToken)
    expect(onLoaded).not.toHaveBeenCalled()
  })

  it('reports once while the resolved data keeps a stable reference across re-renders', () => {
    const data = [overview('1', '0xabc')]
    querySpy.mockReturnValue({ data } as never)
    const onLoaded = jest.fn()
    const safes = [safeItemBuilder().with({ chainId: '1', address: '0xabc' }).build()]

    // The table's map merge relies on this: RTK hands back the same `data` ref until a genuine
    // refetch, so a plain re-render must not re-report already-seen overviews.
    const { rerender } = renderHook(() => useRowOverviews(safes, true, onLoaded))
    rerender()
    rerender()

    expect(onLoaded).toHaveBeenCalledTimes(1)
  })

  it('skips counterfactual safes that have no overview', () => {
    const safe = safeItemBuilder().with({ chainId: '1', address: '0xabc123' }).build()

    renderHook(() => useRowOverviews([safe], true, jest.fn()), {
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

    // Every safe is undeployed, so there is nothing to fetch.
    expect(querySpy).toHaveBeenCalledWith(skipToken)
  })

  it('fetches only the deployed safes of a group row', () => {
    const deployed = safeItemBuilder().with({ chainId: '1', address: '0xdeployed' }).build()
    const undeployed = safeItemBuilder().with({ chainId: '10', address: '0xundeployed' }).build()
    querySpy.mockReturnValue({ data: [overview('1', '0xdeployed')] } as never)

    renderHook(() => useRowOverviews([deployed, undeployed], true, jest.fn()), {
      initialReduxState: {
        undeployedSafes: {
          '10': {
            '0xundeployed': {
              status: { status: 'AWAITING_EXECUTION' },
              props: { safeAccountConfig: { owners: ['0x111'], threshold: 1 } },
            },
          },
        },
      } as unknown as Partial<RootState>,
    })

    expect(querySpy).toHaveBeenCalledWith(expect.objectContaining({ safes: [deployed] }))
  })
})
