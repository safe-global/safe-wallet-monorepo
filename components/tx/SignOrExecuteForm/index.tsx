import { ReactElement, useState } from 'react'
import type { SafeTransaction } from '@gnosis.pm/safe-core-sdk-types'
import { Button, Checkbox, FormControlLabel, FormGroup } from '@mui/material'

import css from './styles.module.css'

import useSafeAddress from '@/services/useSafeAddress'
import { useChainId } from '@/services/useChainId'
import { dispatchTxExecution, dispatchTxProposal, dispatchTxSigning } from '@/services/tx/txSender'
import useWallet from '@/services/wallets/useWallet'
import useGasLimit from '@/services/useGasLimit'
import ErrorToast from '@/components/common/ErrorToast'

type SignOrExecuteProps = {
  safeTx?: SafeTransaction
  txId?: string
  onSubmit: (data: null) => void
}

const SignOrExecuteForm = ({ safeTx, txId, onSubmit }: SignOrExecuteProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const wallet = useWallet()
  const [shouldExecute, setShouldExecute] = useState<boolean>(true)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)

  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(
    shouldExecute && safeTx && wallet
      ? {
          to: safeTx.data.to,
          value: safeTx.data.value,
          data: safeTx.data.data,
          from: wallet.address,
        }
      : undefined,
  )

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
      await dispatchTxExecution(id, safeTx!, { gasLimit })
    })
  }

  const handleSubmit = shouldExecute ? onExecute : onSign

  return (
    <div className={css.container}>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={shouldExecute} onChange={(e) => setShouldExecute(e.target.checked)} />}
          label="Execute Transaction"
        />
      </FormGroup>

      {shouldExecute && (
        <label>
          <div>Gas limit</div>
          <input readOnly disabled={gasLimitLoading} value={gasLimit || ''} />
        </label>
      )}

      <div className={css.submit}>
        <Button variant="contained" onClick={handleSubmit} disabled={!isSubmittable}>
          Submit
        </Button>
      </div>

      {gasLimitError ? <ErrorToast message={gasLimitError!.message.slice(0, 300)} /> : null}
    </div>
  )
}

export default SignOrExecuteForm
