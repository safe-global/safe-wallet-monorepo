import { Severity } from '@safe-global/utils/features/safe-shield/types'
import React from 'react'
import { Stack, Text, Theme, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'
import { safeShieldIcons } from '../../theme'
import type { SimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { Linking } from 'react-native'

interface TransactionSimulationProps {
  severity?: Severity
  highlighted?: boolean
  simulationStatus: SimulationStatus
  simulationLink: string
  requestError?: string
  canSimulate: boolean
  onRunSimulation?: () => void
}

export function TransactionSimulation({
  severity,
  highlighted,
  simulationStatus,
  simulationLink,
  requestError,
  canSimulate,
  onRunSimulation,
}: TransactionSimulationProps) {
  const iconName = severity ? safeShieldIcons[`safeShield_${severity}`] : 'update'
  const themeSeverity = severity || Severity.INFO

  const isLoading = simulationStatus.isLoading
  const isFinished = simulationStatus.isFinished
  const buttonText = isLoading ? 'Running...' : isFinished ? 'View' : 'Run'

  const handleButtonPress = () => {
    if (isFinished && simulationLink) {
      Linking.openURL(simulationLink)
    } else if (onRunSimulation && !isLoading) {
      onRunSimulation()
    }
  }

  const getSimulationHeaderText = () => {
    if (!isFinished) {
      return 'Transaction simulation'
    }
    {
      return severity === Severity.OK ? 'Simulation successful' : 'Simulation failed'
    }
  }

  return (
    <Theme name={`safeShieldAnalysisStatus_${themeSeverity}`}>
      <Stack gap="$3">
        <View flexDirection="row" alignItems="center" gap={'$3'}>
          <SafeFontIcon
            testID={`transaction-simulation-icon`}
            name={iconName}
            color={highlighted ? '$icon' : '$colorLight'}
            size={16}
          />

          <Text color="$color" fontSize="$4">
            {getSimulationHeaderText()}
          </Text>
        </View>

        {requestError && (
          <Text color="$colorError" fontSize="$3">
            {requestError}
          </Text>
        )}

        <SafeButton
          iconAfter={isFinished ? <SafeFontIcon name="external-link" size={16} /> : undefined}
          size="$sm"
          secondary
          gap="$1"
          onPress={handleButtonPress}
          disabled={!canSimulate || isLoading}
        >
          {buttonText}
        </SafeButton>
      </Stack>
    </Theme>
  )
}
