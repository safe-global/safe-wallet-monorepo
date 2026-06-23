import { useNavigation } from 'expo-router'
import { usePreventRemove } from '@react-navigation/native'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { markReviewAbandoned, selectOutstandingRequestByHash } from '../store/walletKitSlice'

/**
 * Detects when the user leaves the confirm-transaction screen for a handed-off WalletConnect
 * tx (pop / iOS swipe / hardware back — not router.replace, which never fires beforeRemove).
 * It only records intent: `markReviewAbandoned` is dispatched and the walletKit listener owns
 * the dApp response. The intercept is armed only while an outstanding WC request exists for
 * this txId, so it is a no-op for native (non-WC) txs.
 *
 * The predicate stays true even while /propose is in flight: the listener no-ops in that
 * window but the reducer records `cancelRequested`, so a propose that then fails still rejects
 * the dApp instead of leaving it to time out.
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
