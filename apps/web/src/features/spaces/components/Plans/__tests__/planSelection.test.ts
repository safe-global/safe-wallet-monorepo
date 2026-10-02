import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { _resetPlansEntry, takePlansEntry, trackPlanSelectionStarted } from '../planSelection'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

describe('planSelection', () => {
  beforeEach(() => _resetPlansEntry())

  it('tracks the start and hands its entry to the next Plans page once, then reads direct', () => {
    trackPlanSelectionStarted({ 'Entry Point': 'sidebar' })
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, { 'Entry Point': 'sidebar' })
    expect(takePlansEntry()).toEqual({ 'Entry Point': 'sidebar' })
    expect(takePlansEntry()).toEqual({ 'Entry Point': 'direct' })
  })
})
