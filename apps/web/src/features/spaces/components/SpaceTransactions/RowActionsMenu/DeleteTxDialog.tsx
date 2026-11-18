import { createContext, useCallback, useContext, useState, type ReactElement, type ReactNode } from 'react'
import DeleteTxModal from '@/components/tx-flow/flows/ReplaceTx/DeleteTxModal'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'

type DeleteTarget = { chainId: string; safeAddress: string; safeTxHash: string }

const DeleteTxDialogContext = createContext<((target: DeleteTarget) => void) | null>(null)

// Rows are virtualized and refreshed live, so the confirmation lives above them and survives a row unmounting
export const DeleteTxDialogProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [target, setTarget] = useState<DeleteTarget>()
  const close = useCallback(() => setTarget(undefined), [])

  return (
    <DeleteTxDialogContext.Provider value={setTarget}>
      {children}
      {target && (
        <SafeScopeProvider
          key={target.safeTxHash}
          initial={{ chainId: target.chainId, safeAddress: target.safeAddress }}
          pollSafeInfo={false}
        >
          <DeleteTxModal safeTxHash={target.safeTxHash} onClose={close} onSuccess={close} />
        </SafeScopeProvider>
      )}
    </DeleteTxDialogContext.Provider>
  )
}

export const useOpenDeleteTxDialog = (): ((target: DeleteTarget) => void) => {
  const open = useContext(DeleteTxDialogContext)
  if (!open) throw new Error('useOpenDeleteTxDialog must be used inside DeleteTxDialogProvider')
  return open
}
