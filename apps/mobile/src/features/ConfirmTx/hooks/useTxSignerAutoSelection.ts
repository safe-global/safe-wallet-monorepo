import { useLayoutEffect } from 'react'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTxSignerState } from '@/src/features/ConfirmTx/hooks/useTxSignerState'
import { useTxSignerActions } from '@/src/features/ConfirmTx/hooks/useTxSignerActions'

export const useTxSignerAutoSelection = (detailedExecutionInfo?: MultisigExecutionDetails) => {
  const { activeTxSigner, appSigners, proposedSigner, hasSigned } = useTxSignerState(detailedExecutionInfo)
  const { setTxSigner } = useTxSignerActions()

  useLayoutEffect(() => {
    if (proposedSigner && activeTxSigner?.value !== proposedSigner.value && hasSigned) {
      console.log('use layout effectproposedSigner', proposedSigner)
      setTxSigner(proposedSigner)
      return
    }

    if (appSigners.length > 0 && !activeTxSigner) {
      setTxSigner(appSigners[0])
      return
    }
  }, [proposedSigner, activeTxSigner, hasSigned, appSigners, setTxSigner])
}
