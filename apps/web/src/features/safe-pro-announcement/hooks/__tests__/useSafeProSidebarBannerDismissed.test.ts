import { act, renderHook } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import {
  SAFE_PRO_SIDEBAR_BANNER_DISMISSED_KEY,
  useSafeProSidebarBannerDismissed,
} from '../useSafeProSidebarBannerDismissed'

describe('useSafeProSidebarBannerDismissed', () => {
  beforeEach(() => {
    local.removeItem(SAFE_PRO_SIDEBAR_BANNER_DISMISSED_KEY)
  })

  it('starts out not dismissed', () => {
    const { result } = renderHook(() => useSafeProSidebarBannerDismissed())

    expect(result.current[0]).toBe(false)
  })

  it('persists the dismissal in local storage', () => {
    const { result } = renderHook(() => useSafeProSidebarBannerDismissed())

    act(() => result.current[1]())

    expect(result.current[0]).toBe(true)
    expect(local.getItem(SAFE_PRO_SIDEBAR_BANNER_DISMISSED_KEY)).toBe(true)
  })
})
