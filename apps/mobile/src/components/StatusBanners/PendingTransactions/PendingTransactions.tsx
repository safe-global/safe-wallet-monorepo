import React from 'react'
import { Spinner } from 'tamagui'

import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Badge } from '@/src/components/Badge'

import { Alert } from '../../Alert'

interface Props {
  number: string
  fullWidth?: boolean
  onPress: () => void
  isLoading?: boolean
}

export const PendingTransactions = ({ number, isLoading, fullWidth, onPress }: Props) => {
  const startIcon = isLoading ? (
    <Spinner size="small" color="$warning1ContrastTextDark" />
  ) : (
    <Badge content={number} themeName="badge_warning_variant2" />
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
