import { renderHook } from '@/tests/test-utils'
import useLoadSafeInfo from '@/hooks/loadables/useLoadSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import * as useSafeAddressFromUrl from '@/hooks/useSafeAddressFromUrl'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { toBeHex } from 'ethers'

const SAFE_ADDRESS = toBeHex('0x1234', 20)

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
})
