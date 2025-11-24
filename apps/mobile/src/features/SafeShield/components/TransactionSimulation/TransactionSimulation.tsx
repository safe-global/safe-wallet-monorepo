import { Severity } from '@safe-global/utils/features/safe-shield/types'
import React from 'react'
import { Stack, Text, Theme, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'

interface TransactionSimulationProps {
  severity: Severity
  highlighted?: boolean
}

export function TransactionSimulation({ severity, highlighted }: TransactionSimulationProps) {
  return (
    <Theme name={`safeShieldAnalysisStatus_${severity}`}>
      <Stack gap="$3">
        <View flexDirection="row" alignItems="center" gap={'$3'}>
          <SafeFontIcon
            testID={`transaction-simulation-icon`}
            name="update"
            color={highlighted ? '$icon' : '$colorLight'}
            size={16}
          />

          <Text color="$color" fontSize="$4">
            Transaction simulation
          </Text>
        </View>

        <SafeButton size="$sm" secondary>
          Run
        </SafeButton>
      </Stack>
    </Theme>
  )
}
