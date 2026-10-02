import { type Delay } from '@gnosis.pm/zodiac'
import { type MetaTransactionData, OperationType } from '@safe-global/types-kit'
import { useCallback } from 'react'

export const useGnosisPayActions = (delayModifier?: Delay, txData?: MetaTransactionData) => {
  const enqueueTx = useCallback(() => {
    if (!delayModifier || !txData) {
      return undefined
    }

    return delayModifier.execTransactionFromModule(
      txData.to,
      txData.value,
      txData.data,
      txData.operation ?? OperationType.Call,
    )
  }, [delayModifier, txData])

  const executeTx = useCallback(() => {
    if (!delayModifier || !txData) {
      return undefined
    }

    return delayModifier.executeNextTx(txData.to, txData.value, txData.data, txData.operation ?? OperationType.Call)
  }, [delayModifier, txData])

  return { enqueueTx, executeTx }
}
