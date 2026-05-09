import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import React from 'react'
import { Container } from '@/src/components/Container'
import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'

type Props = {
  accountType: NOTIFICATION_ACCOUNT_TYPE
  isNotificationEnabled: boolean
}
export const NotificationPermissions = ({ accountType, isNotificationEnabled }: Props) => {
  const isOwner = accountType === NOTIFICATION_ACCOUNT_TYPE.OWNER

  return (
    isNotificationEnabled && (
      <Container position="relative" paddingHorizontal="$4" marginTop={'$4'}>
        <Text marginBottom="$4" fontWeight={400}>
          You will receive notifications for:
        </Text>
        <View flexDirection="row" alignItems="center" gap={8} marginBottom="$4">
          <SafeFontIcon name={'check-filled'} size={18} color="$success" />
          <Text fontWeight={600}>Incoming transactions</Text>
        </View>
        <View flexDirection="row" alignItems="center" gap={8} marginBottom="$4">
          <SafeFontIcon name={'check-filled'} size={18} color="$success" />
          <Text fontWeight={600}>Outgoing transactions</Text>
        </View>
        <View flexDirection="row" alignItems="center" gap={8} marginBottom="$4">
          <SafeFontIcon name={'check-filled'} size={18} color={isOwner ? '$success' : '$colorSecondary'} />
          <Text fontWeight={600} color={isOwner ? '$colorPrimmary' : '$colorSecondary'}>
            Queued transactions
          </Text>
        </View>
        {!isOwner && (
          <View flexDirection="row" alignItems="center" gap={8} marginBottom="$4">
            <Text fontWeight={400} color={'$colorSecondary'} fontSize="$3">
              You need to import at least one signer to receive transaction requests.
            </Text>
          </View>
        )}
      </Container>
    )
  )
}
