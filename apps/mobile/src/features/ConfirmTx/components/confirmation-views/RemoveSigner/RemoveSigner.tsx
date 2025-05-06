import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'

import { formatRemoveSignerItems } from './utils'

import { TransactionHeader } from '../../TransactionHeader'
import { ListTable } from '../../ListTable'
import { getSignerName } from '../AddSigner/utils'
import { ParametersButton } from '../../ParametersButton'
import { NormalizedSettingsChangeTransaction } from '../../ConfirmationView/types'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'

interface RemoveSignerProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function RemoveSigner({ txInfo, executionInfo, txId }: RemoveSignerProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const viewOnExplorer = useOpenExplorer(txInfo.settingsInfo?.owner?.value)

  const items = useMemo(
    () => formatRemoveSignerItems(txInfo, activeChain, viewOnExplorer),
    [txInfo, activeChain, viewOnExplorer],
  )
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

      <ListTable items={items}>
        <ParametersButton txId={txId} />
      </ListTable>
    </YStack>
  )
}
