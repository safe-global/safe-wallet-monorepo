import { ReactElement, useState } from 'react'
import type { SafeTransaction } from '@gnosis.pm/safe-core-sdk-types'
import { Button, Checkbox, FormControlLabel } from '@mui/material'

import css from './styles.module.css'

import useSafeAddress from '@/services/useSafeAddress'
import { useChainId } from '@/services/useChainId'
import { dispatchTxExecution, dispatchTxProposal, dispatchTxSigning } from '@/services/tx/txSender'
import useWallet from '@/services/wallets/useWallet'
import useGasLimit from '@/services/useGasLimit'
import useGasPrice from '@/services/useGasPrice'
import useSafeInfo from '@/services/useSafeInfo'
import GasParams from '@/components/tx/GasParams'
import ErrorMessage from '@/components/tx/ErrorMessage'

type SignOrExecuteProps = {
  safeTx?: SafeTransaction
  txId?: string
  isExecutable: boolean
  onlyExecute?: boolean
  onSubmit: (data: null) => void
}

const SignOrExecuteForm = ({ safeTx, txId, isExecutable, onlyExecute, onSubmit }: SignOrExecuteProps): ReactElement => {
  const { safe } = useSafeInfo()
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const wallet = useWallet()

  // Check that the transaction is executable
  const canExecute = isExecutable && !!safeTx && safeTx.data.nonce === safe?.nonce

  const [shouldExecute, setShouldExecute] = useState<boolean>(true)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)

  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(
    shouldExecute && safeTx && wallet
      ? {
          ...safeTx.data,
          from: wallet.address,
        }
      : undefined,
  )

  const { maxFeePerGas, maxPriorityFeePerGas, gasPriceLoading } = useGasPrice()

  const onFinish = async (actionFn: () => Promise<void>) => {
    if (!wallet || !safeTx) return

    setIsSubmittable(false)
    try {
      await actionFn()
    } catch (err) {
      setIsSubmittable(true)
      return
    }
    onSubmit(null)
  }

  const onSign = async () => {
    onFinish(async () => {
      const signedTx = await dispatchTxSigning(safeTx!, txId)
      await dispatchTxProposal(chainId, safeAddress, wallet!.address, signedTx)
    })
  }

  const onExecute = async () => {
    onFinish(async () => {
      let id = txId
      // If no txId was provided, it's an immediate execution of a new tx
      if (!id) {
        const proposedTx = await dispatchTxProposal(chainId, safeAddress, wallet!.address, safeTx!)
        id = proposedTx.txId
      }

      // @FIXME: pass maxFeePerGas and maxPriorityFeePerGas when Core SDK supports it
      await dispatchTxExecution(id, safeTx!, {
        gasLimit,
        gasPrice: maxFeePerGas?.toString(),
      })
    })
  }

  // If checkbox is checked and the transaction is executable, execute it
  // Otherwise only sign
  const willExecute = shouldExecute && canExecute
  const isEstimating = willExecute && (gasLimitLoading || gasPriceLoading)
  const handleSubmit = willExecute ? onExecute : onSign

  return (
    <div className={css.container}>
      {canExecute && !onlyExecute && (
        <FormControlLabel
          control={<Checkbox checked={shouldExecute} onChange={(e) => setShouldExecute(e.target.checked)} />}
          label="Execute Transaction"
        />
      )}

      {willExecute && (
        <GasParams
          isLoading={isEstimating}
          gasLimit={gasLimit}
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      )}

      {willExecute && gasLimitError && (
        <ErrorMessage>
          This transaction will most likely fail. To save gas costs, avoid creating the transaction.
          <p>{gasLimitError.message}</p>
        </ErrorMessage>
      )}

      <div className={css.submit}>
        <Button variant="contained" onClick={handleSubmit} disabled={!isSubmittable || isEstimating}>
          {isEstimating ? 'Estimating...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}

export default SignOrExecuteForm
