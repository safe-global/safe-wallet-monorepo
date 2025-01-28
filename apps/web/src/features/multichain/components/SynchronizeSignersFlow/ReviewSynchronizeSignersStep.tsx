import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useContext, useEffect } from 'react'
import { type SynchronizeSetupsData } from '.'
import { type SafeSetup } from '../../utils/utils'
import { getRecoveryProposalTransactions } from '@/features/recovery/services/transaction'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'

export const ReviewSynchronizeSignersStep = ({
  data,
  setups,
}: {
  data: SynchronizeSetupsData
  setups: SafeSetup[]
}) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  const { safe } = useSafeInfo()

  useEffect(() => {
    const selectedSetup = setups.find((setup) => setup.chainId === data.selectedChain)
    if (!selectedSetup) {
      // TODO: handle error
      return
    }

    const transactions = getRecoveryProposalTransactions({
      safe,
      newThreshold: selectedSetup.threshold,
      newOwners: selectedSetup.owners.map((owner) => ({
        value: owner,
      })),
    })

    const promisedSafeTx = transactions.length > 1 ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])

    promisedSafeTx.then(setSafeTx).catch(setSafeTxError)
  }, [safe, setSafeTx, setSafeTxError, setups, data.selectedChain])

  return <SignOrExecuteForm />
}
