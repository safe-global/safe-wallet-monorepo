import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { ScrollView } from 'tamagui'

import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { Alert } from '@/src/components/Alert'

import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import ActionsDetails from './ActionsDetails'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'

export function ActionDetailsContainer() {
  const { txId, action, actionName } = useLocalSearchParams<{ txId: string; actionName: string; action: string }>()
  const parsedAction = useMemo(() => JSON.parse(action), [action])

  const { data, isFetching, isError } = useTransactionData(txId)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>{actionName}</NavBarTitle>,
  })

  if (isError) {
    return <Alert type="error" message="Error fetching action details" />
  }

  if (isFetching || !data) {
    return <LoadingTx />
  }

  return (
    <ScrollView onScroll={handleScroll}>
      <LargeHeaderTitle paddingHorizontal="$4" marginBottom="$6">
        {actionName}
      </LargeHeaderTitle>

      <ActionsDetails txDetails={data} action={parsedAction} />
    </ScrollView>
  )
}
