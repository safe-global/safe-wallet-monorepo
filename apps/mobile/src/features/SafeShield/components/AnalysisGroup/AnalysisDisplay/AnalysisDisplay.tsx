import React from 'react'
import type {
  Severity,
  AnalysisResult,
  MaliciousOrModerateThreatAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { Text, View, Stack, useTheme as useTamaguiTheme } from 'tamagui'
import { safeShieldStatusColors } from '../../../theme'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { AnalysisIssuesDisplay } from './components/AnalysisIssuesDisplay'
import { AddressChanges } from './components/AddressChanges'
import { ShowAllAddress } from './components/ShowAllAddress'
import { AnalysisDetailsDropdown } from './components/AnalysisDetailsDropdown'

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

  const renderDescription = () => {
    if (typeof displayDescription === 'string' || typeof displayDescription === 'number') {
      return (
        <Text fontSize="$4" color="$colorLight">
          {displayDescription}
        </Text>
      )
    }

    return displayDescription
  }

  // Double-check in case if issues are undefined:
  const hasIssues = 'issues' in result && !!(result as MaliciousOrModerateThreatAnalysisResult).issues
  const hasError = Boolean(result.error)

  return (
    <View backgroundColor="$backgroundSheet" borderRadius="$1" overflow="hidden">
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          padding: 12,
        }}
      >
        <Stack gap="$3">
          {renderDescription()}

          {hasError && (
            <AnalysisDetailsDropdown
              showLabel="Show details"
              hideLabel="Hide details"
              contentWrapper={(children) => (
                <View
                  marginTop="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  backgroundColor="$backgroundPaper"
                  borderRadius="$1"
                >
                  {children}
                </View>
              )}
            >
              <Text fontSize="$2" lineHeight={14} color="$colorLight" flexWrap="wrap">
                {result.error}
              </Text>
            </AnalysisDetailsDropdown>
          )}

          {isAddressChange(result) && <AddressChanges result={result} />}

          <AnalysisIssuesDisplay result={result} severity={severity} />

          {/* Only show ShowAllAddress dropdown if there are no issues (to avoid duplication) */}
          {!hasIssues && result.addresses?.length ? (
            <ShowAllAddress addresses={result.addresses.map((a) => a.address)} />
          ) : null}
        </Stack>
      </View>
    </View>
  )
}

export default AnalysisDisplay
