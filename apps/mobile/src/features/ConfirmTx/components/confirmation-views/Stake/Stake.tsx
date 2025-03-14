import React, { useMemo } from 'react'
import { ListTable } from '../../ListTable'
import { formatStakingItems } from './utils'
import { YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'

const MOCKED_LOGO = 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png'

// TODO: we need to fix showing staking in the app to make this view to work.
// So far we're not displaying staking transactions in the app.
export function Stake() {
  const items = useMemo(() => formatStakingItems(), [])

  return (
    <YStack gap="$4">
      <TransactionHeader
        submittedAt={0}
        logo={MOCKED_LOGO}
        badgeIcon="transaction-stake"
        badgeColor="$textSecondaryLight"
        title="0.05 ETH"
      />

      <ListTable items={items} />
    </YStack>
  )
}
