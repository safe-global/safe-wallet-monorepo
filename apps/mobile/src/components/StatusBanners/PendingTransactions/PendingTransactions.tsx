import React from 'react'

import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { Loader } from '@/src/components/Loader'
import { Alert } from '../../Alert'

interface Props {
  number: string
  fullWidth?: boolean
  onPress: () => void
  isLoading?: boolean
}

export const PendingTransactions = ({ number, isLoading, fullWidth, onPress }: Props) => {
  const startIcon = isLoading ? (
    <Loader size={24} color="$warning1ContrastTextDark" />
  ) : (
    <Badge content={number} themeName="badge_warning_variant2" circleSize="$6" textContentProps={{ fontWeight: 600 }} />
  )
  const endIcon = <SafeFontIcon name="chevron-right" size={20} />

  return (
    <Alert
      type="warning"
      fullWidth={fullWidth}
      endIcon={endIcon}
      startIcon={startIcon}
      message="Pending transactions"
      onPress={onPress}
      testID="pending-transactions"
    />
  )
}
