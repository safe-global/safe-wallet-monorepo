import React from 'react'
import { Text, View, Theme, ThemeName } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import { getSafeShieldHeadlineVariants } from './variants'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

interface SafeShieldHeadlineProps {
  type?: ThemeName
  onPress?: () => void
  withIcon?: boolean
}

export function SafeShieldHeadline({
  type = `safeShield_${Severity.OK}`,
  onPress,
  withIcon = true,
}: SafeShieldHeadlineProps) {
  const { iconName, title, actionLabel } = getSafeShieldHeadlineVariants(type)

  return (
    <Theme name={type}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
        <View
          backgroundColor="$background"
          padding="$4"
          borderRadius="$2"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <View flexDirection="row" alignItems="center" gap={'$2'}>
            {withIcon && <SafeFontIcon name={iconName} color="$color" size={16} />}

            <Text textTransform="uppercase" color="$color" fontWeight={700} letterSpacing={1} fontSize="$1">
              {title}
            </Text>
          </View>

          {onPress && (
            <Text color="$color" fontSize="$2" fontWeight={700}>
              {actionLabel}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Theme>
  )
}
