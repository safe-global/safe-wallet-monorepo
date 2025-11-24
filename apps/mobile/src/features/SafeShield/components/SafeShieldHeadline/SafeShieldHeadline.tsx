import React from 'react'
import { Text, View, Theme } from 'tamagui'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { getSafeShieldHeadlineVariants } from './variants'

interface SafeShieldHeadlineProps {
  type?: Severity
}

export function SafeShieldHeadline({ type = Severity.OK }: SafeShieldHeadlineProps) {
  const { title } = getSafeShieldHeadlineVariants(`safeShield_${type}`)

  return (
    <Theme name={`safeShieldHeadline_${type}`}>
      <View
        backgroundColor="$background"
        paddingVertical="$3"
        paddingHorizontal="$4"
        borderTopLeftRadius="$3"
        borderTopRightRadius="$3"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text textTransform="uppercase" color="$color" fontWeight={700} letterSpacing={1} fontSize="$1">
          {title}
        </Text>
      </View>
    </Theme>
  )
}
