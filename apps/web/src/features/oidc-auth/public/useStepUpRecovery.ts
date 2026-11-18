import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { registerStepUpRecovery } from '../services/stepUpSession'

/** Call once globally, from `InitApp`; `StepUpDialog` must be mounted too, or a gated request waits forever. */
export const useStepUpRecovery = (): void => {
  const dispatch = useAppDispatch()

  useEffect(() => registerStepUpRecovery(dispatch), [dispatch])
}
