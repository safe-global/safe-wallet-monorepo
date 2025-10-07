import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { clearEstimatedFeeValues } from '@/src/store/estimatedFeeSlice'

// Screens where we should keep the estimated fee state
const KEEP_STATE_SCREENS = ['change-estimated-fee-sheet', 'change-signer-sheet']

/**
 * Custom hook that clears the estimated fee values when leaving the screen,
 * unless navigating to specific screens that need to preserve the state
 */
export const useClearEstimatedFeeOnExit = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  useFocusEffect(
    useCallback(() => {
      console.log('useClearEstimatedFeeOnExit')
      // Set up listener for when leaving the screen
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Check if navigating to a screen where we should keep the state
        const targetRoute = (e.data.action as any)?.payload?.name

        // Clear the state if NOT navigating to a keep-state screen
        if (!targetRoute || !KEEP_STATE_SCREENS.includes(targetRoute)) {
          dispatch(clearEstimatedFeeValues())
        }
      })

      return unsubscribe
    }, [dispatch, navigation]),
  )
}
