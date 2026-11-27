import { useCallback, useContext } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { SafeScopeProvider } from './SafeScopeProvider'
import { ScopedTxFlowOpenerContext } from './ScopedTxFlowOpener'

// The modal renders at the app root, outside any SafeScope, so a scoped caller's scope is re-mounted around the flow
const useSetScopedTxFlow = (): TxModalContextType['setTxFlow'] => {
  const { setTxFlow } = useContext(TxModalContext)
  const openScopedTxFlow = useContext(ScopedTxFlowOpenerContext)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  return useCallback<TxModalContextType['setTxFlow']>(
    (...args) => {
      const [txFlow, onClose, shouldWarn] = args
      if (!txFlow || !chainId || !safeAddress) return setTxFlow(...args)
      if (openScopedTxFlow) return openScopedTxFlow({ chainId, safeAddress }, ...args)

      setTxFlow(<SafeScopeProvider initial={{ chainId, safeAddress }}>{txFlow}</SafeScopeProvider>, onClose, shouldWarn)
    },
    [setTxFlow, openScopedTxFlow, chainId, safeAddress],
  )
}

export default useSetScopedTxFlow
