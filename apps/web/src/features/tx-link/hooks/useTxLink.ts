import { createElement, useContext, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import TxLinkFlow from '../components/TxLinkFlow'
import {
  parseTxLink,
  parseTxLinkNonce,
  TX_LINK_NONCE_QUERY_PARAM,
  TX_LINK_QUERY_PARAM,
  TxLinkError,
} from '../services/parseTxLink'

export const useTxLink = (): void => {
  const router = useRouter()
  const { safeLoaded } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const handledLink = useRef<string>(undefined)

  const rawTxs = router.query[TX_LINK_QUERY_PARAM]
  const rawNonce = router.query[TX_LINK_NONCE_QUERY_PARAM]

  useEffect(() => {
    if (!safeLoaded || typeof rawTxs !== 'string' || handledLink.current === rawTxs) return
    handledLink.current = rawTxs

    let flowProps: Parameters<typeof TxLinkFlow>[0]
    try {
      flowProps = {
        txs: parseTxLink(rawTxs),
        nonce: typeof rawNonce === 'string' ? parseTxLinkNonce(rawNonce) : undefined,
      }
    } catch (error) {
      const message = error instanceof TxLinkError ? error.message : 'The transaction link could not be read'
      dispatch(showNotification({ variant: 'error', title: 'Invalid transaction link', message, groupKey: 'tx-link' }))
      return
    }

    // The query is removed first: an open tx flow blocks navigation behind the discard dialog
    const { [TX_LINK_QUERY_PARAM]: _txs, [TX_LINK_NONCE_QUERY_PARAM]: _nonce, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true }).then(() => {
      setTxFlow(createElement(TxLinkFlow, flowProps))
    })
  }, [safeLoaded, rawTxs, rawNonce, router, setTxFlow, dispatch])
}
