import { useCallback, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { ScopedTxFlowOpenerContext, type ScopedTxFlowOpener } from '@/components/tx-flow/safe-scope/ScopedTxFlowOpener'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import useSafeInfo from '@/hooks/useSafeInfo'

type PendingFlow = { target: SafeScopeTarget; args: Parameters<TxModalContextType['setTxFlow']> }

/**
 * Opens the queue rows' flows on the URL Safe, like the Space dashboard does, so the header shows the Safe
 * being transacted on. Each flow waits until the URL Safe's info and SDK belong to its row's Safe.
 */
const UrlSafeTxFlowOpener = ({ children }: { children: ReactNode }): ReactElement => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const { safe, safeLoaded } = useSafeInfo()
  const sdk = useSafeSDK()
  const [pending, setPending] = useState<PendingFlow>()

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

  const isTargetLoaded =
    !!pending &&
    safeLoaded &&
    safe.chainId === pending.target.chainId &&
    sameAddress(safe.address.value, pending.target.safeAddress)

  useEffect(() => {
    if (!pending || !sdk || !isTargetLoaded) return
    let cancelled = false

    // The SDK can still be the previous Safe's for a render after the Safe info switches
    Promise.all([sdk.getAddress(), sdk.getChainId()]).then(([address, chainId]) => {
      if (cancelled) return
      if (!sameAddress(address, pending.target.safeAddress) || chainId.toString() !== pending.target.chainId) return

      const [txFlow, onClose, shouldWarn] = pending.args
      setPending(undefined)
      setTxFlow(
        txFlow,
        () => {
          onClose?.()
          void setUrlSafe(undefined)
        },
        shouldWarn,
      )
    })

    return () => {
      cancelled = true
    }
  }, [pending, sdk, isTargetLoaded, setTxFlow, setUrlSafe])

  return <ScopedTxFlowOpenerContext.Provider value={openFlow}>{children}</ScopedTxFlowOpenerContext.Provider>
}

export default UrlSafeTxFlowOpener
