import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { setUnauthenticated, setAuthenticated } from '@/store/authSlice'
import {
  _clearTrialReminders,
  markTrialReminderSeen,
  trialReminderListener,
  wasTrialReminderSeen,
} from '../trialReminder'

describe('trialReminder', () => {
  beforeEach(() => sessionStorage.clear())

  it('remembers the dismissal per Workspace within the session', () => {
    expect(wasTrialReminderSeen('s1')).toBe(false)

    markTrialReminderSeen('s1')

    expect(wasTrialReminderSeen('s1')).toBe(true)
    expect(wasTrialReminderSeen('s2')).toBe(false)

    markTrialReminderSeen('s2')
    expect(wasTrialReminderSeen('s1')).toBe(true)
    expect(wasTrialReminderSeen('s2')).toBe(true)

    _clearTrialReminders()
    expect(wasTrialReminderSeen('s1')).toBe(false)
  })

  it('forgets every dismissal when the user signs out', () => {
    const listenerMiddleware = createListenerMiddleware<RootState>()
    trialReminderListener(listenerMiddleware)
    const run = listenerMiddleware.middleware({ getState: jest.fn(), dispatch: jest.fn() })(jest.fn())
    markTrialReminderSeen('s1')

    run(setAuthenticated(Date.now() + 60_000))
    expect(wasTrialReminderSeen('s1')).toBe(true)

    run(setUnauthenticated())
    expect(wasTrialReminderSeen('s1')).toBe(false)
  })
})
