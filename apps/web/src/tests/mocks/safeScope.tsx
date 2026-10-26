import type { ReactElement, ReactNode } from 'react'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue, SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'

export const safeScopeContextFor = (target?: SafeScopeTarget): SafeScopeContextValue => ({
  scope: target
    ? {
        ...target,
        scopeKey: buildSafeScopeKey(target.chainId, target.safeAddress),
        safeLoaded: false,
        safeLoading: true,
      }
    : undefined,
  setScope: jest.fn(),
  clearScope: jest.fn(),
})

export const mockSetTxFlow = () => jest.fn<void, Parameters<TxModalContextType['setTxFlow']>>()

/** Renders `children` with a spied `setTxFlow` and, when `scope` is given, inside that SafeScope. */
export const TxModalWithScope = ({
  setTxFlow,
  scope,
  children,
}: {
  setTxFlow: TxModalContextType['setTxFlow']
  scope?: SafeScopeContextValue
  children: ReactNode
}) => (
  <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
    <SafeScopeContext.Provider value={scope}>{children}</SafeScopeContext.Provider>
  </TxModalContext.Provider>
)

type ScopeProviderProps = { initial?: SafeScopeTarget; pollSafeInfo?: boolean; children: ReactElement }

/** Splits a flow passed to `setTxFlow` into the flow itself and the SafeScope it was wrapped in, if any. */
export const unwrapScopedFlow = (
  txFlow: ReactElement | undefined,
): { flow: ReactElement | undefined; target?: SafeScopeTarget; pollSafeInfo?: boolean } => {
  if (txFlow?.type !== SafeScopeProvider) return { flow: txFlow }
  const { initial, pollSafeInfo, children } = txFlow.props as ScopeProviderProps
  return { flow: children, target: initial, pollSafeInfo }
}
