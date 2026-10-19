import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { renderHook } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { spaceBuilder } from '@/tests/builders/space'
import { useIsAllowlistActiveInSpace } from '../useIsAllowlistActiveInSpace'

const CURRENT_SPACE_ID = 'space-uuid-1'

const mockIsAuthenticated = jest.fn()
const mockUseSpacesGetOneV1Query = jest.fn()

jest.mock('@/hooks/useUrlSpaceId', () => ({
  useUrlSpaceId: () => CURRENT_SPACE_ID,
}))

jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: () => mockIsAuthenticated(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: (...args: unknown[]) => mockUseSpacesGetOneV1Query(...args),
}))

const sepolia = chainBuilder()
  .with({ chainId: '11155111', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()
const sepoliaOff = chainBuilder().with({ chainId: '11155111', features: [] }).build()

const optedIn = spaceBuilder()
  .with({ experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] })
  .build()
const optedOut = spaceBuilder().with({ experimentalFeatures: [] }).build()

const mockChains = (configs: Chain[]) => jest.spyOn(useChains, 'default').mockReturnValue({ configs, loading: false })
const mockFlag = (value: boolean | undefined) => jest.spyOn(useChains, 'useHasFeature').mockReturnValue(value)

describe('useIsAllowlistActiveInSpace', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockIsAuthenticated.mockReturnValue(true)
    mockChains([sepolia])
    mockFlag(true)
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: optedIn, isLoading: false })
  })

  it('is true when the flag is on, the allowlist is available and the space opted in', () => {
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBe(true)
  })

  it('is undefined while the chain config is loading', () => {
    mockFlag(undefined)
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBeUndefined()
  })

  it('is undefined while the space is loading', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: undefined, isLoading: true })
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBeUndefined()
  })

  it('is false when the workspace flag is off', () => {
    mockFlag(false)
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBe(false)
  })

  it('is false when no chain has the allowlist deployed', () => {
    mockChains([sepoliaOff])
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBe(false)
  })

  it('is false when the space has not opted in', () => {
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: optedOut, isLoading: false })
    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBe(false)
  })

  it('skips the query and is false while signed out', () => {
    mockIsAuthenticated.mockReturnValue(false)
    mockUseSpacesGetOneV1Query.mockReturnValue({ currentData: undefined, isLoading: false })

    expect(renderHook(() => useIsAllowlistActiveInSpace()).result.current).toBe(false)
    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith({ id: CURRENT_SPACE_ID }, { skip: true })
  })

  it('reads the given spaceId instead of the current one', () => {
    renderHook(() => useIsAllowlistActiveInSpace('other-space'))

    expect(mockUseSpacesGetOneV1Query).toHaveBeenCalledWith({ id: 'other-space' }, { skip: false })
  })
})
