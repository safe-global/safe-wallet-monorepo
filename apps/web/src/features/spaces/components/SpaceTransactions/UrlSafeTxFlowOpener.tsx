import { useCallback, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { ScopedTxFlowOpenerContext, type ScopedTxFlowOpener } from '@/components/tx-flow/safe-scope/ScopedTxFlowOpener'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { logError, Errors } from '@/services/exceptions'

type PendingFlow = { target: SafeScopeTarget; args: Parameters<TxModalContextType['setTxFlow']> }

export const LOAD_TIMEOUT_MS = 15_000

/**
 * Opens the queue rows' flows on the URL Safe, like the Space dashboard does, so the header shows the Safe
 * being transacted on. Each flow waits until the URL Safe's info and SDK belong to its row's Safe.
 */
const UrlSafeTxFlowOpener = ({ children }: { children: ReactNode }): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { txFlow: openTxFlow, setTxFlow } = useContext(TxModalContext)
  const { safe, safeLoaded } = useSafeInfo()
  const sdk = useSafeSDK()
  const [pending, setPending] = useState<PendingFlow>()
  const ownsUrlSafe = useRef(false)

  const setUrlSafe = useCallback(
    (shortName: string | undefined, safeAddress?: string) =>
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          safe: shortName && safeAddress ? `${shortName}:${safeAddress}` : undefined,
          chain: shortName,
        },
      }),
    [router],
  )

  const openFlow = useCallback<ScopedTxFlowOpener>(
    (target, ...args) => {
      const shortName = getEip3770ShortName(target.chainId)
      if (!shortName) return
      setPending({ target, args })
      void setUrlSafe(shortName, target.safeAddress)
    },
    [setUrlSafe],
  )

  const failToOpen = useCallback(
    (error?: unknown) => {
      if (error) logError(Errors._600, error)
      setPending(undefined)
      void setUrlSafe(undefined)
      dispatch(
        showNotification({
          message: "Couldn't load this Safe account. Try again.",
          groupKey: 'space-queue-open-flow',
          variant: 'error',
        }),
      )
    },
    [dispatch, setUrlSafe],
  )

  useEffect(() => {
    if (!pending) return
    const timeout = setTimeout(failToOpen, LOAD_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [pending, failToOpen])

  const isTargetLoaded =
    !!pending &&
    safeLoaded &&
    safe.chainId === pending.target.chainId &&
    sameAddress(safe.address.value, pending.target.safeAddress)

  useEffect(() => {
    if (!pending || !sdk || !isTargetLoaded) return
    let cancelled = false

    // The SDK can still be the previous Safe's for a render after the Safe info switches
    Promise.all([sdk.getAddress(), sdk.getChainId()])
      .then(([address, chainId]) => {
        if (cancelled) return
        if (!sameAddress(address, pending.target.safeAddress) || chainId.toString() !== pending.target.chainId) return

        setPending(undefined)
        ownsUrlSafe.current = true
        setTxFlow(...pending.args)
      })
      .catch((error) => {
        if (!cancelled) failToOpen(error)
      })

    return () => {
      cancelled = true
    }
  }, [pending, sdk, isTargetLoaded, setTxFlow, failToOpen])

  // A flow can end without its onClose (e.g. after a success screen), so clear the URL Safe once no flow is open
  useEffect(() => {
    if (openTxFlow || pending || !ownsUrlSafe.current) return
    ownsUrlSafe.current = false
    void setUrlSafe(undefined)
  }, [openTxFlow, pending, setUrlSafe])

  return <ScopedTxFlowOpenerContext.Provider value={openFlow}>{children}</ScopedTxFlowOpenerContext.Provider>
}

export default UrlSafeTxFlowOpener
