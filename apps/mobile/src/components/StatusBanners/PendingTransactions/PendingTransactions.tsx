import React from 'react'
import { TouchableOpacity } from 'react-native'
import { View, Text, Theme, getTokenValue } from 'tamagui'

import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { Loader } from '@/src/components/Loader'

interface Props {
  number: string
  fullWidth?: boolean
  onPress: () => void
  isLoading?: boolean
}

export const PendingTransactions = ({ number, isLoading, onPress }: Props) => {
  const displayNumber = number.length > 3 ? '99+' : number

  return (
    <Theme name="warning">
      <TouchableOpacity onPress={onPress} testID="pending-transactions">
        <View
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          backgroundColor="$background"
          borderRadius="$4"
          padding="$3"
          width="100%"
        >
          <View flexDirection="row" alignItems="center" gap="$2">
            {isLoading ? (
              <Loader size={24} color={getTokenValue('$color.warning1ContrastTextDark')} />
            ) : (
              <Badge
                content={displayNumber}
                themeName="badge_warning_variant2"
                circular={false}
                circleProps={{
                  borderRadius: 8,
                  paddingVertical: 1,
                  paddingHorizontal: '$1',
                  minWidth: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                textContentProps={{ fontWeight: 700, fontSize: 16, lineHeight: 22 }}
              />
            )}
            <Text fontSize="$4" fontWeight={600} letterSpacing={-0.1}>
              Pending transactions
            </Text>
          </View>
          <SafeFontIcon name="chevron-right" size={24} />
        </View>
      </TouchableOpacity>
    </Theme>
  )
}
