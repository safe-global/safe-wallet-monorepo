import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { useRouter } from 'expo-router'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionSecurity } from './hooks/useTransactionSecurity'
import { getTransactionChecksLabel } from './utils/transactionChecksUtils'
import { TransactionChecksLeftNode } from './components/TransactionChecksLeftNode'
import { TransactionChecksBottomContent } from './components/TransactionChecksBottomContent'

interface TransactionChecksProps {
  txId: string
  txDetails?: TransactionDetails
}

export function TransactionChecks({ txId, txDetails }: TransactionChecksProps) {
  const router = useRouter()
  const security = useTransactionSecurity(txDetails)

  const handleTransactionChecksPress = () => {
    router.push({
      pathname: '/transaction-checks',
      params: { txId },
    })
  }

  return (
    <SafeListItem
      onPress={handleTransactionChecksPress}
      leftNode={<TransactionChecksLeftNode security={security} />}
      label={getTransactionChecksLabel(security.isScanning)}
      rightNode={<SafeFontIcon name="chevron-right" />}
      bottomContent={<TransactionChecksBottomContent security={security} />}
    />
  )
}
