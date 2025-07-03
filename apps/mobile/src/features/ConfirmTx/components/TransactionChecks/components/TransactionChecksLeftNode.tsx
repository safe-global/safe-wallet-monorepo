import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { CircleSnail } from 'react-native-progress'
import { getTransactionChecksIcon, SecurityState } from '../utils/transactionChecksUtils'

interface TransactionChecksLeftNodeProps {
  security: SecurityState
}

export const TransactionChecksLeftNode = ({ security }: TransactionChecksLeftNodeProps) => {
  if (security.isScanning) {
    return <CircleSnail size={16} borderWidth={0} thickness={1} />
  }

  return <SafeFontIcon name={getTransactionChecksIcon(security)} />
}
