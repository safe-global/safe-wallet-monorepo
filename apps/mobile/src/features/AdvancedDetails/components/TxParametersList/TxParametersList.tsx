import React, { useMemo } from 'react'

import { formatParameters } from './utils/formatParameters'
import { formatTxDetails } from './utils/formatTxDetails'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { Stack } from 'tamagui'

interface TxParametersListProps {
  txDetails: TransactionDetails
}

export function TxParametersList({ txDetails }: TxParametersListProps) {
  const parameters = useMemo(() => formatParameters({ txData: txDetails.txData }), [txDetails.txData])
  const transactionDetails = useMemo(() => formatTxDetails({ txDetails }), [txDetails])

  return (
    <Stack gap={20}>
      <ListTable items={transactionDetails} />

      <ListTable items={parameters} />
    </Stack>
  )
}
