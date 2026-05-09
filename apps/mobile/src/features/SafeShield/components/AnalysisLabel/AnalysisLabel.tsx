import { Severity } from '@safe-global/utils/features/safe-shield/types'
import React from 'react'
import { Text, Theme, View } from 'tamagui'
import { safeShieldIcons } from '../../theme'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface AnalysisLabelProps {
  label: string
  severity: Severity
  highlighted?: boolean
}

export function AnalysisLabel({ label, severity, highlighted }: AnalysisLabelProps) {
  const iconName = safeShieldIcons[`safeShield_${severity}`]

  return (
    <Theme name={`safeShieldAnalysisStatus_${severity}`}>
      <View flexDirection="row" alignItems="center" gap={'$3'}>
        <SafeFontIcon
          testID={`${iconName}-icon`}
          name={iconName}
          color={highlighted ? '$icon' : '$borderMain'}
          size={16}
        />

        <Text color="$color" fontSize="$4">
          {label}
        </Text>
      </View>
    </Theme>
  )
}
