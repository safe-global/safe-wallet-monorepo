import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { clearEstimatedFeeValues } from '@/src/store/estimatedFeeSlice'

/**
 * Custom hook that clears the estimated fee values when the component is first mounted
 * Note: We don't clear the execution method here as it should persist during the session
 */
export const useClearEstimatedFeeOnMount = () => {
  const dispatch = useDispatch()
  const isInitialized = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isInitialized.current) {
      dispatch(clearEstimatedFeeValues())
      isInitialized.current = true
    }
  }, [dispatch])
}
