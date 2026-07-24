import { renderHook } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useIsSpaceRoute } from '../useIsSpaceRoute'
import * as store from '@/store'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.Mock

describe('useIsSpaceRoute', () => {
  const mockSpaceId = '42'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(store, 'useAppSelector').mockReturnValue(mockSpaceId)
  })

  it('returns true on /spaces', () => {
    mockUsePathname.mockReturnValue('/spaces')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(true)
  })

  it('returns true on a prefix route like /spaces/settings', () => {
    mockUsePathname.mockReturnValue('/spaces/settings')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(true)
  })

  it('returns true on /spaces/billing', () => {
    mockUsePathname.mockReturnValue('/spaces/billing')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(true)
  })

  it('returns true on a nested prefix route like /spaces/settings/general', () => {
    mockUsePathname.mockReturnValue('/spaces/settings/general')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(true)
  })

  it('returns false on /spaces/create-space', () => {
    mockUsePathname.mockReturnValue('/spaces/create-space')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false on /spaces/transactions', () => {
    mockUsePathname.mockReturnValue('/spaces/transactions')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('does not match a prefix-overlap like /spaces/settings-foo', () => {
    mockUsePathname.mockReturnValue('/spaces/settings-foo')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false on a non-spaces route', () => {
    mockUsePathname.mockReturnValue('/welcome')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false when there is no last-used space, even on a matching route', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue(undefined)
    mockUsePathname.mockReturnValue('/spaces')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false when pathname is null', () => {
    mockUsePathname.mockReturnValue(null)
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })
})
