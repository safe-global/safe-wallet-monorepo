import React from 'react'
import { View, Text } from 'tamagui'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'

interface ReceiverProps {
  txData: TransactionDetails['txData']
}

export function Receiver({ txData }: ReceiverProps) {
  const { to: { value = '', name, logoUri } = {} } = txData || {}

  const contact = useAppSelector(selectContactByAddress(value))

  const content = contact?.name || name

  if (!content) {
    return null
  }

  return (
    <View
      backgroundColor="$backgroundSecondary"
      padding="$2"
      paddingHorizontal="$3"
      borderRadius="$8"
      flexDirection="row"
      alignItems="center"
      gap="$2"
      alignSelf="flex-start"
    >
      <Logo logoUri={logoUri} size="$4" />
      <Text fontWeight={600}>{content}</Text>
      <SafeFontIcon name="check-oulined" color="$success" size={16} style={{ marginLeft: 'auto' }} />
    </View>
  )
}
