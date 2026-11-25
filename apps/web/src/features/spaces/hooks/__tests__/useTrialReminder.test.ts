import { act, renderHook } from '@/tests/test-utils'
import { markTrialReminderSeen, _clearTrialReminders } from '../../public/store/trialReminder'
import { setTrialReminderShowing, useIsTrialReminderPending } from '../useTrialReminder'

const mockUseSpacePlan = jest.fn()
const mockMembership = jest.fn()

jest.mock('../useSpacePlan', () => ({ useSpacePlan: () => mockUseSpacePlan() }))
jest.mock('../../public/hooks/useSpaceMembers', () => ({ useCurrentMembership: () => mockMembership() }))

const SPACE_ID = '1'
const plan = (overrides = {}) => ({ isLoading: false, isTrialEndingSoon: false, hasPaymentMethod: false, ...overrides })

describe('useIsTrialReminderPending', () => {
  beforeEach(() => {
    _clearTrialReminders()
    act(() => setTrialReminderShowing(false))
    mockUseSpacePlan.mockReturnValue(plan())
    mockMembership.mockReturnValue({ id: 1 })
  })

  it('is false when the trial is not ending soon', () => {
    expect(renderHook(() => useIsTrialReminderPending(SPACE_ID)).result.current).toBe(false)
  })

  it('is true while the plan is still loading', () => {
    mockUseSpacePlan.mockReturnValue(plan({ isLoading: true }))

    expect(renderHook(() => useIsTrialReminderPending(SPACE_ID)).result.current).toBe(true)
  })

  it('is true when the reminder is due and not yet seen', () => {
    mockUseSpacePlan.mockReturnValue(plan({ isTrialEndingSoon: true }))

    expect(renderHook(() => useIsTrialReminderPending(SPACE_ID)).result.current).toBe(true)
  })

  it('is false once the reminder was seen or a payment method is on file', () => {
    mockUseSpacePlan.mockReturnValue(plan({ isTrialEndingSoon: true, hasPaymentMethod: true }))
    expect(renderHook(() => useIsTrialReminderPending(SPACE_ID)).result.current).toBe(false)

    mockUseSpacePlan.mockReturnValue(plan({ isTrialEndingSoon: true }))
    markTrialReminderSeen(SPACE_ID)
    expect(renderHook(() => useIsTrialReminderPending(SPACE_ID)).result.current).toBe(false)
  })

  it('stays true while the reminder is on screen and clears when it closes', () => {
    const { result } = renderHook(() => useIsTrialReminderPending(SPACE_ID))

    act(() => setTrialReminderShowing(true))
    expect(result.current).toBe(true)

    act(() => setTrialReminderShowing(false))
    expect(result.current).toBe(false)
  })
})
