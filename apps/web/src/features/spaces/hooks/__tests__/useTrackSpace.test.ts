import { renderHook } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useTrackSpace from '../useTrackSpace'
import type { AllSafeItems } from '@/hooks/safes'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    TOTAL_SAFE_ACCOUNTS: { action: 'Total safes added to space', category: 'spaces' },
    TOTAL_ACTIVE_MEMBERS: { action: 'Total active members in space', category: 'spaces' },
  },
}))

const mockTrackEvent = trackEvent as jest.Mock

describe('useTrackSpace', () => {
  const safes = [{ id: '1' }, { id: '2' }] as unknown as AllSafeItems
  const members = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] as unknown as Member[]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks total safe accounts on mount', () => {
    renderHook(() => useTrackSpace(safes, members))

    expect(mockTrackEvent).toHaveBeenCalledWith({
      ...SPACE_EVENTS.TOTAL_SAFE_ACCOUNTS,
      label: safes.length,
    })
  })

  it('tracks total active members on mount', () => {
    renderHook(() => useTrackSpace(safes, members))

    expect(mockTrackEvent).toHaveBeenCalledWith({
      ...SPACE_EVENTS.TOTAL_ACTIVE_MEMBERS,
      label: members.length,
    })
  })

  it('tracks each event only once per instance even if deps change', () => {
    const { rerender } = renderHook(({ s, m }: { s: AllSafeItems; m: Member[] }) => useTrackSpace(s, m), {
      initialProps: { s: safes, m: members },
    })

    const updatedSafes = [...safes, { id: '3' }] as unknown as AllSafeItems
    const updatedMembers = [...members, { id: 'm4' }] as unknown as Member[]

    rerender({ s: updatedSafes, m: updatedMembers })

    expect(mockTrackEvent).toHaveBeenCalledTimes(2)
  })

  it('tracks independently per instance (no shared module state)', () => {
    renderHook(() => useTrackSpace(safes, members))
    renderHook(() => useTrackSpace(safes, members))

    expect(mockTrackEvent).toHaveBeenCalledTimes(4)
  })
})
