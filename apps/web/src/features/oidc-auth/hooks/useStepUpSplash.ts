import { useEffect, useRef } from 'react'
import { MAX_DISPLAY_MS } from '@/components/common/LaunchScreen/useLaunchScreen'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectStepUpPhase, selectStepUpReturnUrl, stepUpSettled } from '../store'
import { startStepUp } from '../utils/stepUp'

const CAPTIONS = {
  leaving: 'Verifying your identity…',
  returning: 'Finishing your request…',
} as const

export const useStepUpSplash = (): string | undefined => {
  const dispatch = useAppDispatch()
  const phase = useAppSelector(selectStepUpPhase)
  const returnUrl = useAppSelector(selectStepUpReturnUrl)
  // A ref, so a return URL changing while the browser leaves cannot start a second redirect.
  const returnUrlRef = useRef(returnUrl)
  returnUrlRef.current = returnUrl

  useEffect(() => {
    if (phase !== 'leaving') return

    // Started here, not in the store listener, so the splash screen renders
    // before the browser navigates away.
    startStepUp(returnUrlRef.current)
  }, [phase])

  useEffect(() => {
    if (phase === 'idle') return

    const id = setTimeout(() => dispatch(stepUpSettled()), MAX_DISPLAY_MS)
    return () => clearTimeout(id)
  }, [phase, dispatch])

  return phase === 'idle' ? undefined : CAPTIONS[phase]
}
