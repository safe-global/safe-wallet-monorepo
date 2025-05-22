import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { formatAddSignerItems, getSignerName } from './utils'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'

import { ListTable } from '../../ListTable'
import { TransactionHeader } from '../../TransactionHeader'
import { ParametersButton } from '../../ParametersButton'
import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'

interface AddSignerProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function AddSigner({ txInfo, executionInfo, txId }: AddSignerProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const viewOnExplorer = useOpenExplorer(txInfo.settingsInfo?.owner?.value)
  const items = useMemo(
    () => formatAddSignerItems(txInfo, activeChain, executionInfo, viewOnExplorer),
    [txInfo, activeChain, executionInfo, viewOnExplorer],
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

      <ListTable items={items}>
        <ParametersButton txId={txId} />
      </ListTable>
    </YStack>
  )
}
