import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { View, Text } from 'tamagui'
import { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useTheme } from '@/src/theme/hooks/useTheme'

interface RelayAvailableProps {
  isLoadingRelays: boolean
  relaysRemaining?: RelaysRemaining
  executionMethod: ExecutionMethod
}

export const RelayAvailable = ({ isLoadingRelays, relaysRemaining, executionMethod }: RelayAvailableProps) => {
  const { colorScheme } = useTheme()

  return (
    <View width="100%" flexDirection="row" justifyContent="space-between" alignItems="center">
      <View flex={1}>
        <Text fontWeight="600" fontSize="$5">
          Sponsored by Safe
        </Text>
        <View flexDirection="row" alignItems="center" gap="$2" marginTop="$1">
          <Text color="$colorSecondary" fontSize="$4">
            We pay transactions fees for you
          </Text>
          {isLoadingRelays ? (
            <Skeleton colorMode={colorScheme} height={16} width={80} />
          ) : (
            relaysRemaining && <Text fontSize="$4">{relaysRemaining.remaining} left / day</Text>
          )}
        </View>
      </View>
      {executionMethod === ExecutionMethod.WITH_RELAY && (
        <View marginLeft="$2">
          <SafeFontIcon name="check" size={20} color="$color" />
        </View>
      )}
    </View>
  )
}
