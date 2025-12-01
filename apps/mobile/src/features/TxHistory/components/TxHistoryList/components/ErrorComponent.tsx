import React from 'react'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

const ErrorComponentBase = () => (
  <View
    flex={1}
    alignItems="center"
    justifyContent="center"
    paddingTop="$8"
    paddingHorizontal="$4"
    testID="tx-history-error"
  >
    <SafeFontIcon name="info" size={48} color="$colorSecondary" />
    <Text fontSize="$5" fontWeight="600" marginTop="$4" textAlign="center">
      Error fetching transactions
    </Text>
    <Text fontSize="$3" color="$colorSecondary" marginTop="$2" textAlign="center">
      Swipe down to retry
    </Text>
  </View>
)

export const ErrorComponent = React.memo(ErrorComponentBase)
ErrorComponent.displayName = 'ErrorComponent'
