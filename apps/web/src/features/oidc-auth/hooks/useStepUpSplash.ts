import { useEffect } from 'react'
import { MAX_DISPLAY_MS } from '@/components/common/LaunchScreen/useLaunchScreen'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectStepUpPhase, stepUpSettled } from '../store'
import { startStepUp } from '../utils/stepUp'

const CAPTIONS = {
  leaving: 'Verifying your identity…',
  returning: 'Finishing your request…',
} as const

/**
 * Caption to hold the launch screen open with while a step-up round-trip is in
 * flight, or `undefined` when there is nothing to wait for.
 *
 * Also *starts* the redirect: the navigation is fired from here rather than by
 * the store listener so the splash is painted before the browser leaves.
 */
export const useStepUpSplash = (): string | undefined => {
  const dispatch = useAppDispatch()
  const phase = useAppSelector(selectStepUpPhase)

  useEffect(() => {
    if (phase !== 'leaving') return

    // A suppressed redirect (one already in flight, or a challenge already spent
    // this page load) would otherwise hold the splash open forever.
    if (!startStepUp()) dispatch(stepUpSettled())
  }, [phase, dispatch])

  useEffect(() => {
    if (phase === 'idle') return

    // Mirrors the launch screen's own hard cap: a hanging gateway must never
    // trap the user behind a splash that has no controls.
    const id = setTimeout(() => dispatch(stepUpSettled()), MAX_DISPLAY_MS)
    return () => clearTimeout(id)
  }, [phase, dispatch])

  return phase === 'idle' ? undefined : CAPTIONS[phase]
}
