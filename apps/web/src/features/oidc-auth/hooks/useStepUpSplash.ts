import { useEffect } from 'react'
import { MAX_DISPLAY_MS } from '@/components/common/LaunchScreen/useLaunchScreen'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectStepUpPhase, stepUpSettled } from '../store'
import { startStepUp } from '../utils/stepUp'

const CAPTIONS = {
  leaving: 'Verifying your identity…',
  returning: 'Finishing your request…',
} as const

export const useStepUpSplash = (): string | undefined => {
  const dispatch = useAppDispatch()
  const phase = useAppSelector(selectStepUpPhase)

  useEffect(() => {
    if (phase !== 'leaving') return

    // Started here, not in the store listener, so the splash screen renders
    // before the browser navigates away.
    startStepUp()
  }, [phase])

  useEffect(() => {
    if (phase === 'idle') return

    // If the gateway never answers, the user is left on a splash screen that has
    // no way to continue.
    const id = setTimeout(() => dispatch(stepUpSettled()), MAX_DISPLAY_MS)
    return () => clearTimeout(id)
  }, [phase, dispatch])

  return phase === 'idle' ? undefined : CAPTIONS[phase]
}
