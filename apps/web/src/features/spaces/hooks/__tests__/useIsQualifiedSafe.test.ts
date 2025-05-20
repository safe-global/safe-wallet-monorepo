import { renderHook } from '@testing-library/react'
import useIsQualifiedSafe from '../useIsQualifiedSafe'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(), // we never call it but the reference must exist
}))
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: jest.fn(),
}))
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/config/routes', () => ({
  AppRoutes: {
    spaces: { index: '/spaces' },
    welcome: { spaces: '/welcome/spaces' },
  },
}))

import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { useRouter } from 'next/router'

const baseRouterPath = '/safes/1/0xSafe1'

describe('useIsQualifiedSafe', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue('1')
    ;(useAppSelector as jest.Mock).mockReturnValue(true)
    ;(useSafeAddressFromUrl as jest.Mock).mockReturnValue('0xSafe1')
    ;(useChainId as jest.Mock).mockReturnValue('1')
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
    ;(useRouter as jest.Mock).mockReturnValue({ pathname: baseRouterPath })
    jest.spyOn(spacesQueries, 'useSpacesGetOneV1Query').mockReturnValue({
      currentData: { id: 1, name: 'My space' },
      refetch: jest.fn(),
    })
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: { safes: { '1': ['0xSafe1'] } },
      refetch: jest.fn(),
    })
  })

  it('returns true when every prerequisite is fulfilled', () => {
    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(true)
  })

  it('returns false when user is not signed in', () => {
    ;(useAppSelector as jest.Mock).mockReturnValue(false)
    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(false)
  })

  it('returns false when there is no current space id', () => {
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(undefined)
    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(false)
  })

  it('returns false when user is on a space route', () => {
    ;(useRouter as jest.Mock).mockReturnValue({ pathname: '/spaces?spaceId=1' })
    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(false)
  })

  it('returns false when the Spaces feature flag is disabled', () => {
    ;(useHasFeature as jest.Mock).mockReturnValue(false)
    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(false)
  })

  it('returns false when the viewed Safe is not part of the current space', () => {
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: { safes: { '1': ['0xOtherSafe'] } },
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useIsQualifiedSafe())
    expect(result.current).toBe(false)
  })
})
