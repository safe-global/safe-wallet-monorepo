import React, { useEffect } from 'react'
import { useNavigation } from 'expo-router'
import { useStore } from 'react-redux'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { useAppDispatch } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { selectDraftByHash } from '@/src/store/draftTxSlice'
import { getWalletKit } from '../walletKit'
import { clearOutstandingRequest, selectOutstandingRequestByHash } from '../store/walletKitSlice'

type Props = { safeTxHash: string }

/**
 * Invisible side-effect component. Mounted inside /review-and-confirm to detect when
 * the user navigates back (pop / iOS swipe / hardware back) — React Navigation's
 * `beforeRemove` event fires on those but NOT on router.replace(), so the
 * sign-success / sign-error transitions don't trigger it.
 *
 * Only sends USER_REJECTED to the dApp if the tx is still in DRAFT state. Once the
 * tx is proposed (signed and submitted to CGW), the draft is cleared by draftTxSlice's
 * auto-cleanup — at that point the propose-fulfilled listener has either already
 * responded with success or is mid-flight, and a reject here would race with it and
 * potentially overwrite the success response.
 *
 * If the txId on this screen isn't a WC request (e.g. native Send flow), the
 * outstanding lookup misses and the handler is a no-op — safe to mount unconditionally.
 */
export const WcRejectOnBack: React.FC<Props> = ({ safeTxHash }) => {
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const state = store.getState()
      const outstanding = selectOutstandingRequestByHash(state, safeTxHash)
      if (!outstanding) {
        return
      }
      // Only reject drafted txs. A cleared draft means the tx was proposed — let the
      // propose-fulfilled listener handle the dApp response.
      const draft = selectDraftByHash(state, safeTxHash)
      if (!draft) {
        return
      }
      void (async () => {
        try {
          const wk = await getWalletKit()
          await wk.respondSessionRequest({
            topic: outstanding.topic,
            response: formatJsonRpcError(outstanding.id, getSdkError('USER_REJECTED').message),
          })
        } catch (e) {
          console.log('[walletKit] reject-on-back failed', e)
        }
        dispatch(clearOutstandingRequest(safeTxHash))
      })()
    })
    return unsubscribe
  }, [navigation, safeTxHash, store, dispatch])

  return null
}
