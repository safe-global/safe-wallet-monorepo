import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatRemoveSignerItems } from './utils'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getSignerName } from '../AddSigner/utils'

import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'

interface RemoveSignerProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function RemoveSigner({ txInfo, executionInfo }: RemoveSignerProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const items = useMemo(() => formatRemoveSignerItems(txInfo, activeChain), [txInfo, activeChain])
  const newRemovedSigners = getSignerName(txInfo)

  return (
    <YStack gap="$4">
      <TransactionHeader
        submittedAt={executionInfo.submittedAt}
        logo={txInfo.settingsInfo?.owner?.value}
        isIdenticon
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={newRemovedSigners}
      />

      <ListTable items={items} />
    </YStack>
  )
}
