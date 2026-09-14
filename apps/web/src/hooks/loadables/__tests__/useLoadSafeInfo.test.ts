import { renderHook } from '@/tests/test-utils'
import useLoadSafeInfo from '@/hooks/loadables/useLoadSafeInfo'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import * as useChains from '@/hooks/useChains'
import * as safeAddressFromUrl from '@/hooks/useSafeAddressFromUrl'
import * as core from '@/features/__core__'
import * as store from '@/store'
import { Errors, logError } from '@/services/exceptions'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { toBeHex } from 'ethers'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedLogError = logError as jest.MockedFunction<typeof logError>

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const CHAIN_ID = '5'

type CgwError = { status: number; message?: string }

describe('useLoadSafeInfo error reporting', () => {
  const mockQuery = (error: CgwError | undefined) =>
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      currentData: undefined,
      error,
      isLoading: false,
      refetch: jest.fn(),
      // The hook reads only these three fields off the query result.
    } as unknown as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

  const mockState = ({ hydrated = true, authenticated = false, cfSynced = true } = {}) =>
    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        auth: {
          sessionExpiresAt: authenticated ? Date.now() + 60_000 : undefined,
          isStoreHydrated: hydrated,
          cfSafeSynced: cfSynced,
        },
        undeployedSafes: {},
      } as unknown as Parameters<typeof selector>[0]),
    )

  beforeEach(() => {
    jest.clearAllMocks()
    mockedLogError.mockClear()

    jest.spyOn(safeAddressFromUrl, 'useSafeAddressFromUrl').mockReturnValue(SAFE_ADDRESS)
    jest.spyOn(useChainId, 'default').mockReturnValue(CHAIN_ID)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: CHAIN_ID }).build())
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: extendedSafeInfoBuilder().build(),
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    } as unknown as ReturnType<typeof useSafeInfo.default>)
    jest
      .spyOn(core, 'useLoadFeature')
      .mockReturnValue([{ getUndeployedSafeInfo: jest.fn() }, { $isReady: false }] as unknown as ReturnType<
        typeof core.useLoadFeature
      >)
    mockState()
  })

  it('reports a failing load once, not once per poll', () => {
    // RTK Query writes a fresh error object on every rejection, so a Safe stuck
    // failing its 15s poll used to emit one event every 15 seconds forever.
    mockQuery({ status: 500, message: 'Internal Server Error' })

    const { rerender } = renderHook(() => useLoadSafeInfo())

    mockQuery({ status: 500, message: 'Internal Server Error' })
    rerender()
    mockQuery({ status: 500, message: 'Internal Server Error' })
    rerender()

    expect(mockedLogError).toHaveBeenCalledTimes(1)
    expect(mockedLogError).toHaveBeenCalledWith(Errors._600, 'Internal Server Error', undefined)
  })

  it('reports again when the failure changes', () => {
    mockQuery({ status: 500, message: 'Internal Server Error' })
    const { rerender } = renderHook(() => useLoadSafeInfo())

    mockQuery({ status: 503, message: 'Service Unavailable' })
    rerender()

    expect(mockedLogError).toHaveBeenCalledTimes(2)
  })

  it('stays silent for a 404 while the counterfactual sync is still pending', () => {
    mockState({ authenticated: true, cfSynced: false })
    mockQuery({ status: 404, message: 'Not found' })

    renderHook(() => useLoadSafeInfo())

    expect(mockedLogError).not.toHaveBeenCalled()
  })

  it('still reports a real server error while the counterfactual sync is pending', () => {
    mockState({ authenticated: true, cfSynced: false })
    mockQuery({ status: 500, message: 'Internal Server Error' })

    renderHook(() => useLoadSafeInfo())

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('reports a 404 once the counterfactual sync has settled', () => {
    mockState({ authenticated: true, cfSynced: true })
    mockQuery({ status: 404, message: 'Not found' })

    renderHook(() => useLoadSafeInfo())

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('reports nothing when the load succeeds', () => {
    mockQuery(undefined)

    renderHook(() => useLoadSafeInfo())

    expect(mockedLogError).not.toHaveBeenCalled()
  })
})
