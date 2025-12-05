import React from 'react'
import type { Severity, AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { Text, View, Stack, useTheme as useTamaguiTheme } from 'tamagui'
import { safeShieldStatusColors } from '../../../theme'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { AnalysisIssuesDisplay } from './components/AnalysisIssuesDisplay'
import { AddressChanges } from './components/AddressChanges'
import { ShowAllAddress } from './components/ShowAllAddress'

interface AnalysisDisplayProps {
  result: AnalysisResult
  description?: React.ReactNode
  severity?: Severity
}

export function AnalysisDisplay({ result, description, severity }: AnalysisDisplayProps) {
  const tamaguiTheme = useTamaguiTheme()
  const { isDark } = useTheme()
  const displayDescription = description ?? result.description

  // Get border color based on severity, fallback to border color
  const getBorderColor = () => {
    if (!severity) {
      return tamaguiTheme.borderMain?.val || tamaguiTheme.borderMain?.get() || '#E5E5E5'
    }

    const colors = safeShieldStatusColors[isDark ? 'dark' : 'light']
    return colors[severity]?.color || tamaguiTheme.borderMain?.val || tamaguiTheme.borderMain?.get() || '#E5E5E5'
  }

  const borderColor = getBorderColor()

  return (
    <View backgroundColor="$backgroundPaper" borderRadius="$1" overflow="hidden">
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          padding: 12,
        }}
      >
        <Stack gap="$3">
          <Text fontSize="$4" color="$colorLight">
            {displayDescription}
          </Text>

          <AnalysisIssuesDisplay result={result} />

          {isAddressChange(result) && <AddressChanges result={result} />}

          {result.addresses?.length && <ShowAllAddress addresses={result.addresses.map((a) => a.address)} />}
        </Stack>
      </View>
    </View>
  )
}

export default AnalysisDisplay
