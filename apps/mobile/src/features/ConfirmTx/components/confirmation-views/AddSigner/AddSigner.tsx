import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { formatAddSignerItems, getSignerName } from './utils'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'
interface AddSignerProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function AddSigner({ txInfo, executionInfo }: AddSignerProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const items = useMemo(
    () => formatAddSignerItems(txInfo, activeChain, executionInfo),
    [txInfo, activeChain, executionInfo],
  )
  const newSignerAddress = getSignerName(txInfo)

  return (
    <YStack gap="$4">
      <TransactionHeader
        submittedAt={executionInfo.submittedAt}
        logo={txInfo.settingsInfo?.owner?.value}
        isIdenticon
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={newSignerAddress}
      />

      <ListTable items={items} />
    </YStack>
  )
}
