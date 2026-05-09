import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ActionValueDecoded } from '@safe-global/store/gateway/types'
import React, { useMemo } from 'react'
import { ListTable } from '../ConfirmTx/components/ListTable'
import { formatActionDetails } from './utils'
import { View } from 'tamagui'

function ActionsDetails({ txDetails, action }: { txDetails: TransactionDetails; action: ActionValueDecoded }) {
  const items = useMemo(() => txDetails && formatActionDetails({ txData: txDetails.txData, action }), [txDetails])

  return (
    <View paddingHorizontal="$4">
      <ListTable items={items} />
    </View>
  )
}

export default ActionsDetails
