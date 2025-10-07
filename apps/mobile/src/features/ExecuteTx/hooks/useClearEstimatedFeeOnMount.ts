import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { clearEstimatedFeeValues } from '@/src/store/estimatedFeeSlice'

/**
 * Custom hook that clears the estimated fee values when the component is first mounted
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
