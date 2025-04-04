import { Typography } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { getRecoveryProposalTransactions } from '@/features/recovery/services/transaction'
import EthHashInfo from '@/components/common/EthHashInfo'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import type { ChangeOwnerStructureForm } from '.'

export function ReviewStructure({ params }: { params: ChangeOwnerStructureForm }): ReactElement {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  useEffect(() => {
    const transactions = getRecoveryProposalTransactions({
      safe,
      newThreshold: params.threshold,
      newOwners: params.owners.map((owner) => ({
        value: owner.address,
      })),
    })

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = transactions.length > 1
      return isMultiSend ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [params.owners, params.threshold, safe, safe.deployed, setSafeTx, setSafeTxError])

  return (
    <SignOrExecuteForm>
      {params.owners.map((owner) => (
        <EthHashInfo key={owner.address} address={owner.address} shortAddress={false} showCopyButton hasExplorer />
      ))}

      <div>
        <Typography fontWeight={700} gutterBottom>
          Required confirmations for new transactions:
        </Typography>
        <Typography>
          {params.threshold} out of {params.owners.length} owner(s)
        </Typography>
      </div>
    </SignOrExecuteForm>
  )
}
