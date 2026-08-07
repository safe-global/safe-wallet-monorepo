import { useNavigation } from 'expo-router'
import { usePreventRemove } from '@react-navigation/native'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { markReviewAbandoned, selectOutstandingRequestByHash } from '../store/walletKitSlice'

/**
 * Dispatches markReviewAbandoned when the user backs out of review for a handed-off WC tx; the
 * walletKit listener owns the response. Armed only while an outstanding request exists (no-op for
 * native txs), and stays armed during /propose so cancelRequested can settle a later failure.
 */
export const useWcReviewAbandon = (safeTxHash: string) => {
  const dispatch = useAppDispatch()
  const navigation = useNavigation()
  const outstanding = useAppSelector((state) => selectOutstandingRequestByHash(state, safeTxHash))

  usePreventRemove(Boolean(outstanding), ({ data }) => {
    dispatch(markReviewAbandoned({ safeTxHash }))
    navigation.dispatch(data.action)
  })
}
