import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet } from '../store'

export const useStepUpReturnUrl = (returnUrl: string | undefined): void => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!returnUrl) return

    dispatch(stepUpReturnUrlSet(returnUrl))
    return () => {
      dispatch(stepUpReturnUrlCleared(returnUrl))
    }
  }, [dispatch, returnUrl])
}
