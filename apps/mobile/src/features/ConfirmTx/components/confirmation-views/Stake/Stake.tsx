import React, { useMemo } from 'react'
import { ListTable } from '../../ListTable'
import { formatStakingItems } from './utils'
import { YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'

const MOCKED_LOGO = 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png'

export function Stake() {
  const items = useMemo(() => formatStakingItems({}), [])

  return (
    <YStack gap="$4">
      <TransactionHeader
        logo={MOCKED_LOGO}
        badgeIcon="transaction-stake"
        badgeColor="$textSecondaryLight"
        title="0.05 ETH"
        description="6 Sep 2024, 17:35"
      />

      <ListTable items={items} />
    </YStack>
  )
}
