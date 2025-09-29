import React, { ReactNode } from 'react'
import { View, Text, H4, getTokenValue } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton/SafeButton'

interface LedgerErrorProps {
  /** The main error title */
  title: string
  /** The primary error description */
  description: string
  /** Optional detailed error message */
  errorMessage?: string
  /** Button text for the retry action */
  buttonText: string
  /** Callback for retry action */
  onRetry: () => void
  /** Optional test ID for the retry button */
  testID?: string
  /** Optional icon component to display in the error circle */
  icon?: ReactNode
}

export const LedgerError = ({
  title,
  description,
  errorMessage,
  buttonText,
  onRetry,
  testID,
  icon,
}: LedgerErrorProps) => {
  return (
    <View flex={1} justifyContent="space-between">
      <View flex={1} justifyContent="center" alignItems="center">
        <View alignItems="center" gap="$6" paddingHorizontal="$4">
          {icon && (
            <View position="relative" width={150} height={200} alignItems="center" justifyContent="center">
              <View
                position="absolute"
                alignItems="center"
                justifyContent="center"
                flexDirection="row"
                gap="$2"
                overflow="hidden"
                width={150}
                height={150}
                borderRadius={150}
                borderWidth={4}
                borderColor={getTokenValue('$color.errorMainDark')}
              >
                {icon}
              </View>
            </View>
          )}

          <View alignItems="center" gap="$3">
            <H4 fontWeight="600" color="$color" textAlign="center">
              {title}
            </H4>
            <Text color="$colorSecondary" textAlign="center" fontSize="$4">
              {description}
            </Text>
            {errorMessage && (
              <Text color="$colorSecondary" textAlign="center" fontSize="$3" paddingTop="$2">
                {errorMessage}
              </Text>
            )}
          </View>
        </View>
      </View>

      <SafeButton onPress={onRetry} primary testID={testID}>
        {buttonText}
      </SafeButton>
    </View>
  )
}
