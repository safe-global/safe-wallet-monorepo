import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { useRouter } from 'expo-router'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionSecurity } from './hooks/useTransactionSecurity'
import { getTransactionChecksLabel, shouldShowBottomContent } from './utils/transactionChecksUtils'
import { TransactionChecksLeftNode } from './components/TransactionChecksLeftNode'
import { TransactionChecksBottomContent } from './components/TransactionChecksBottomContent'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { selectActiveChain } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'

interface TransactionChecksProps {
  txId: string
  txDetails?: TransactionDetails
}

export function TransactionChecks({ txId, txDetails }: TransactionChecksProps) {
  const router = useRouter()
  const chain = useAppSelector(selectActiveChain)
  const security = useTransactionSecurity(txDetails)
  const blockaidEnabled = useHasFeature(FEATURES.RISK_MITIGATION) ?? false
  const tenderlyEnabled = isTxSimulationEnabled(chain ?? undefined) ?? false

  const handleTransactionChecksPress = () => {
    router.push({
      pathname: '/transaction-checks',
      params: { txId },
    })
  }

  if (!tenderlyEnabled && !blockaidEnabled) {
    return null
  }

  return (
    <SafeListItem
      onPress={handleTransactionChecksPress}
      leftNode={<TransactionChecksLeftNode security={security} />}
      label={getTransactionChecksLabel(security.isScanning)}
      rightNode={<SafeFontIcon name="chevron-right" size={16} />}
      bottomContent={shouldShowBottomContent(security) ? <TransactionChecksBottomContent security={security} /> : null}
    />
  )
}
