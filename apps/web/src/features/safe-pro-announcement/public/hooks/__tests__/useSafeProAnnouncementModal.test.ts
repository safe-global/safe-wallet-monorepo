import { createElement, useState } from 'react'
import { act, render, renderHook, screen } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { _resetOverlayQueue } from '@/services/overlay-queue/store'
import { useOverlay } from '@/services/overlay-queue/useOverlay'
import { useSafeProAnnouncementModal, SAFE_PRO_ANNOUNCEMENT_SEEN_KEY } from '../useSafeProAnnouncementModal'

jest.mock('@/hooks/useIsSafeProEnabled')
jest.mock('../useIsSafeProAnnouncementEnabled')

const mockUseIsSafeProEnabled = jest.requireMock('@/hooks/useIsSafeProEnabled').useIsSafeProEnabled as jest.Mock
const mockUseIsSafeProAnnouncementEnabled = jest.requireMock('../useIsSafeProAnnouncementEnabled')
  .useIsSafeProAnnouncementEnabled as jest.Mock

describe('useSafeProAnnouncementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    _resetOverlayQueue()
    mockUseIsSafeProAnnouncementEnabled.mockReturnValue(true)
    mockUseIsSafeProEnabled.mockReturnValue(false)
  })

  it('opens on the first ready render and records that it was seen', () => {
    const { result } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(true)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBe(true)
  })

  it('stays shut on a later visit', () => {
    renderHook(() => useSafeProAnnouncementModal(true))

    const { result } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(false)
  })

  it.each([true, false])(
    'never opens, and records nothing, once Safe Pro is live (announcement flag %s)',
    (isAnnounced) => {
      mockUseIsSafeProAnnouncementEnabled.mockReturnValue(isAnnounced)
      mockUseIsSafeProEnabled.mockReturnValue(true)

      const { result } = renderHook(() => useSafeProAnnouncementModal(true))

      expect(result.current.isOpen).toBe(false)
      expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBeNull()
    },
  )

  it('never opens while the announcement flag is off', () => {
    mockUseIsSafeProAnnouncementEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(false)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBeNull()
  })

  it('does nothing, and records nothing, while the workspace is not ready', () => {
    const { result } = renderHook(() => useSafeProAnnouncementModal(false))

    expect(result.current.isOpen).toBe(false)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBeNull()
  })

  it('opens once the workspace becomes ready', () => {
    const { result, rerender } = renderHook(({ isWorkspaceReady }) => useSafeProAnnouncementModal(isWorkspaceReady), {
      initialProps: { isWorkspaceReady: false },
    })

    expect(result.current.isOpen).toBe(false)

    rerender({ isWorkspaceReady: true })

    expect(result.current.isOpen).toBe(true)
  })

  it('opens once the announcement flag arrives late', () => {
    mockUseIsSafeProAnnouncementEnabled.mockReturnValue(false)
    const { result, rerender } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(false)

    mockUseIsSafeProAnnouncementEnabled.mockReturnValue(true)
    rerender()

    expect(result.current.isOpen).toBe(true)
  })

  it('stays open after it records that it was seen, until it is closed', () => {
    const { result } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(true)

    act(() => result.current.close())

    expect(result.current.isOpen).toBe(false)
  })

  it('waits while a tour is on screen, and records that it was seen only once it shows', () => {
    let closeTour = () => {}
    const Tour = () => {
      const [isDue, setIsDue] = useState(true)
      closeTour = () => setIsDue(false)
      return useOverlay({ kind: 'guide', isDue }) ? createElement('p', null, 'Tour') : null
    }
    render(createElement(Tour))
    expect(screen.getByText('Tour')).toBeInTheDocument()

    const { result } = renderHook(() => useSafeProAnnouncementModal(true))

    expect(result.current.isOpen).toBe(false)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBeNull()

    act(() => closeTour())

    expect(result.current.isOpen).toBe(true)
    expect(local.getItem<boolean>(SAFE_PRO_ANNOUNCEMENT_SEEN_KEY)).toBe(true)
  })
})
