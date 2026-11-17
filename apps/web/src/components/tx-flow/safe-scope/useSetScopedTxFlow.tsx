import { useCallback, useContext } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { SafeScopeProvider } from './SafeScopeProvider'

// The modal renders at the app root, outside any SafeScope, so a scoped caller's scope is re-mounted around the flow
const useSetScopedTxFlow = (): TxModalContextType['setTxFlow'] => {
  const { setTxFlow } = useContext(TxModalContext)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  return useCallback<TxModalContextType['setTxFlow']>(
    (...args) => {
      const [txFlow, onClose, shouldWarn] = args
      if (!txFlow || !chainId || !safeAddress) return setTxFlow(...args)

      setTxFlow(
        <SafeScopeProvider initial={{ chainId, safeAddress }} pollSafeInfo={false}>
          {txFlow}
        </SafeScopeProvider>,
        onClose,
        shouldWarn,
      )
    },
    [setTxFlow, chainId, safeAddress],
  )
}

export default useSetScopedTxFlow
