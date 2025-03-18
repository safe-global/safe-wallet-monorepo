import React from 'react'

import { H3, Text, View } from 'tamagui'
import EmptyBell from './EmptyBell'

export const NotificationsScreenEmpty = () => {
  return (
    <View testID="empty-notifications" alignItems="center" gap="$4" marginTop="$6">
      <EmptyBell />
      <H3 fontWeight={600}>All caught up!</H3>
      <Text textAlign="center" color="$colorSecondary" width="70%" fontSize="$4">
        Nicely done. You have no pending activity.
      </Text>
    </View>
  )
}
