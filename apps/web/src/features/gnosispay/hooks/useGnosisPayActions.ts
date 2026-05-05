import { type Delay } from '@gnosis.pm/zodiac'
import { type SafeTransactionData } from '@safe-global/types-kit'
import { useCallback } from 'react'

export const useGnosisPayActions = (delayModifier?: Delay, safeTxData?: SafeTransactionData) => {
  const enqueueTx = useCallback(() => {
    if (!delayModifier || !safeTxData) {
      return undefined
    }

    return delayModifier.execTransactionFromModule(
      safeTxData.to,
      safeTxData.value,
      safeTxData.data,
      safeTxData.operation,
    )
  }, [delayModifier, safeTxData])

  const executeTx = useCallback(() => {
    if (!delayModifier || !safeTxData) {
      return undefined
    }

    return delayModifier.executeNextTx(safeTxData.to, safeTxData.value, safeTxData.data, safeTxData.operation)
  }, [delayModifier, safeTxData])

  return { enqueueTx, executeTx }
}
