import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '../SafeFontIcon'

interface ParametersButtonProps {
  txId: string
  title?: string
}

export function ParametersButton({ txId, title = 'Transaction details' }: ParametersButtonProps) {
  const goToAdvancedDetails = () => {
    router.push({
      pathname: '/transaction-parameters',
      params: { txId },
    })
  }

  return (
    <TouchableOpacity onPress={goToAdvancedDetails} activeOpacity={0.7} testID="transaction-details-button">
      <View
        backgroundColor="$backgroundFocus"
        padding="$4"
        paddingVertical="$3"
        borderBottomLeftRadius="$2"
        borderBottomRightRadius="$2"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap="$0"
      >
        <View flexDirection="row" alignItems="center" justifyContent="center" gap="$1">
          <Text fontWeight={600}>{title}</Text>
        </View>

        <SafeFontIcon name="chevron-right" size={16} color="$color" />
      </View>
    </TouchableOpacity>
  )
}
