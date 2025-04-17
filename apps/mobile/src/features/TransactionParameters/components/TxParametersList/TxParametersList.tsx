import React, { useMemo } from 'react'
import { View } from 'tamagui'

import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { formatParameters } from './utils'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxParametersListProps {
  txDetails: TransactionDetails
}

export function TxParametersList({ txDetails }: TxParametersListProps) {
  const items = useMemo(() => formatParameters({ txData: txDetails.txData }), [txDetails.txData])

  return (
    <View margin="$4">
      <ListTable items={items} />
    </View>
  )
}
