import { renderHook } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { useSafeProAnnouncement, SAFE_PRO_ANNOUNCEMENT_SEEN_KEY } from '../useSafeProAnnouncement'

describe('useSafeProAnnouncement', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens on the first ready render and records that it was seen', () => {
    const { result } = renderHook(() => useSafeProAnnouncement(true))

    expect(result.current.isOpen).toBe(true)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBe(true)
  })

  it('stays shut on a later visit', () => {
    renderHook(() => useSafeProAnnouncement(true))

    const { result } = renderHook(() => useSafeProAnnouncement(true))

    expect(result.current.isOpen).toBe(false)
  })

  it('does nothing, and records nothing, while not ready', () => {
    const { result } = renderHook(() => useSafeProAnnouncement(false))

    expect(result.current.isOpen).toBe(false)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBeNull()
  })

  it('opens once the caller becomes ready, so a flag arriving late still announces', () => {
    const { result, rerender } = renderHook(({ isReady }) => useSafeProAnnouncement(isReady), {
      initialProps: { isReady: false },
    })

    expect(result.current.isOpen).toBe(false)

    rerender({ isReady: true })

    expect(result.current.isOpen).toBe(true)
  })
})
