import { renderHook, waitFor } from '@/tests/test-utils'
import useLoadSafeInfo from '@/hooks/loadables/useLoadSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { getUndeployedSafeInfo } from '@/features/counterfactual/public/safeDeployment'
import type { RootState } from '@/store'
import * as useSafeAddressFromUrl from '@/hooks/useSafeAddressFromUrl'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { toBeHex } from 'ethers'

jest.mock('@/features/counterfactual/public/safeDeployment', () => ({
  getUndeployedSafeInfo: jest.fn(),
}))

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const mockGetUndeployedSafeInfo = jest.mocked(getUndeployedSafeInfo)

describe('useLoadSafeInfo', () => {
  let querySpy: jest.SpyInstance

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(useSafeAddressFromUrl, 'useSafeAddressFromUrl').mockReturnValue(SAFE_ADDRESS)
    querySpy = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error: undefined,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)
  })

  it('queries the backend for a resolved chain', () => {
    jest.spyOn(useChainId, 'default').mockReturnValue('1')

    renderHook(() => useLoadSafeInfo())

    expect(querySpy).toHaveBeenCalledWith(
      { chainId: '1', safeAddress: SAFE_ADDRESS },
      expect.objectContaining({ skip: false }),
    )
  })

  it('makes no request at all when the chain is unresolved, rather than querying a default', () => {
    jest.spyOn(useChainId, 'default').mockReturnValue('')

    renderHook(() => useLoadSafeInfo())

    expect(querySpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('reports no Safe when chain and address are empty, not the blank defaultSafeInfo', () => {
    jest.spyOn(useChainId, 'default').mockReturnValue('')
    jest.spyOn(useSafeAddressFromUrl, 'useSafeAddressFromUrl').mockReturnValue('')

    const { result } = renderHook(() => useLoadSafeInfo())

    expect(result.current[0]).toBeUndefined()
  })

  describe('undeployed Safe', () => {
    const chain = chainBuilder().with({ chainId: '1' }).build()
    const undeployedSafe = {
      status: { status: 'AWAITING_EXECUTION' },
      props: { safeAccountConfig: { owners: [SAFE_ADDRESS], threshold: 1 } },
    }
    const initialReduxState = {
      undeployedSafes: { '1': { [SAFE_ADDRESS]: undeployedSafe } },
    } as unknown as Partial<RootState>
    const undeployedSafeInfo = { address: { value: SAFE_ADDRESS }, deployed: false } as unknown as ReturnType<
      typeof getUndeployedSafeInfo
    >

    beforeEach(() => {
      mockGetUndeployedSafeInfo.mockReset()
      mockGetUndeployedSafeInfo.mockReturnValue(undeployedSafeInfo)
      jest.spyOn(useChainId, 'default').mockReturnValue('1')
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chain)
    })

    it('loads the Safe info of an undeployed Safe when the counterfactual flag is on', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

      const { result } = renderHook(() => useLoadSafeInfo(), { initialReduxState })

      await waitFor(() => expect(result.current[0]).toEqual(undeployedSafeInfo))
      expect(mockGetUndeployedSafeInfo).toHaveBeenCalledWith(undeployedSafe, SAFE_ADDRESS, chain)
    })

    it('does not load the Safe info of an undeployed Safe when the counterfactual flag is off', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

      renderHook(() => useLoadSafeInfo(), { initialReduxState })
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockGetUndeployedSafeInfo).not.toHaveBeenCalled()
    })
  })
})
