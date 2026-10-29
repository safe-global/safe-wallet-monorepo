import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { addDays } from 'date-fns'
import { IS_PRODUCTION } from '@/config/constants'
import { sessionItem } from '@/services/local-storage/session'

/** Prototype-only: lets a reviewer preview each trial state without a real trial. */
export const MOCK_TRIAL_STATES = {
  normal: { label: '> 3 days', daysLeft: 12 },
  three: { label: '3 days', daysLeft: 3 },
  one: { label: '1 day', daysLeft: 1 },
  last: { label: 'Last day', daysLeft: 0 },
} as const

export type MockTrialState = keyof typeof MOCK_TRIAL_STATES

const isMockTrialState = (value: unknown): value is MockTrialState =>
  typeof value === 'string' && value in MOCK_TRIAL_STATES

const mockTrialItem = sessionItem<MockTrialState>('proTrialBannerMock')

/** `?mockTrial=normal|three|one|last|off` or the dev control; kept for the session so it follows page changes. */
export const useMockTrial = () => {
  const { query } = useRouter()
  const [state, setState] = useState<MockTrialState | null>(null)

  const select = useCallback((next: MockTrialState | null) => {
    if (next) mockTrialItem.set(next)
    else mockTrialItem.remove()
    setState(next)
  }, [])

  useEffect(() => {
    if (IS_PRODUCTION) return
    const fromQuery = query.mockTrial
    if (fromQuery === 'off') select(null)
    else if (isMockTrialState(fromQuery)) select(fromQuery)
    else setState(mockTrialItem.get() ?? null)
  }, [query.mockTrial, select])

  const mock = state ? { state, endsAt: addDays(new Date(), MOCK_TRIAL_STATES[state].daysLeft).getTime() } : null

  return { mock, select, isAvailable: !IS_PRODUCTION }
}
