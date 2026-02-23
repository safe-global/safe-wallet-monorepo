import { renderHook } from '@/tests/test-utils'
import { useParentSafeThreshold } from '../useParentSafeThreshold'
import * as useNestedSafeOwnersModule from '@/hooks/useNestedSafeOwners'
import * as useChainIdModule from '@/hooks/useChainId'
import * as safesQueries from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('useParentSafeThreshold', () => {
  const chainId = '1'
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const owners = [
    { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
    { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
    { value: checksumAddress(faker.finance.ethereumAddress()), name: null, logoUri: null },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(chainId)
  })

  it('should return undefined values when no nested safe owners exist', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue(null)
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    const { result } = renderHook(() => useParentSafeThreshold())

    expect(result.current).toEqual({
      threshold: undefined,
      owners: undefined,
      parentSafeAddress: undefined,
      isLoading: false,
    })
  })

  it('should return undefined values when nested safe owners is empty', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([])
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    const { result } = renderHook(() => useParentSafeThreshold())

    expect(result.current).toEqual({
      threshold: undefined,
      owners: undefined,
      parentSafeAddress: undefined,
      isLoading: false,
    })
  })

  it('should return isLoading=true while loading', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    const { result } = renderHook(() => useParentSafeThreshold())

    expect(result.current).toEqual({
      threshold: undefined,
      owners: undefined,
      parentSafeAddress: undefined,
      isLoading: true,
    })
  })

  it('should return threshold and owners when parent safe data is available', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress])
    jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: {
        threshold: 2,
        owners,
        address: { value: parentSafeAddress, name: null, logoUri: null },
        chainId,
        nonce: 0,
        implementationVersionState: 'UP_TO_DATE',
        modules: [],
        guard: null,
        fallbackHandler: null,
        version: '1.4.1',
        collectiblesTag: '0',
        txQueuedTag: '0',
        txHistoryTag: '0',
        messagesTag: '0',
      },
      isLoading: false,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    const { result } = renderHook(() => useParentSafeThreshold())

    expect(result.current).toEqual({
      threshold: 2,
      owners,
      parentSafeAddress,
      isLoading: false,
    })
  })

  it('should use first owner as parent safe address', () => {
    const secondParentSafe = checksumAddress(faker.finance.ethereumAddress())
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([parentSafeAddress, secondParentSafe])
    const mockQuery = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: {
        threshold: 1,
        owners: owners.slice(0, 1),
        address: { value: parentSafeAddress, name: null, logoUri: null },
        chainId,
        nonce: 0,
        implementationVersionState: 'UP_TO_DATE',
        modules: [],
        guard: null,
        fallbackHandler: null,
        version: '1.4.1',
        collectiblesTag: '0',
        txQueuedTag: '0',
        txHistoryTag: '0',
        messagesTag: '0',
      },
      isLoading: false,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    const { result } = renderHook(() => useParentSafeThreshold())

    expect(result.current.parentSafeAddress).toBe(parentSafeAddress)
    expect(mockQuery).toHaveBeenCalledWith({ chainId, safeAddress: parentSafeAddress }, { skip: false })
  })

  it('should skip query when no parent safe address', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue(null)
    const mockQuery = jest.spyOn(safesQueries, 'useSafesGetSafeV1Query').mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: jest.fn(),
    } as ReturnType<typeof safesQueries.useSafesGetSafeV1Query>)

    renderHook(() => useParentSafeThreshold())

    expect(mockQuery).toHaveBeenCalledWith({ chainId, safeAddress: '' }, { skip: true })
  })
})
