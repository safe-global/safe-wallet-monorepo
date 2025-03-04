import React from 'react'
import { InputProps, Text, Theme, View } from 'tamagui'
import { StyledInput, StyledInputContainer } from './styled'
import { getInputThemeName } from './utils'
import { SafeFontIcon } from '../SafeFontIcon'

export interface SafeInputProps {
  error?: React.ReactNode | string
  placeholder?: string
  height?: number
  success?: boolean
  left?: React.ReactNode
  right?: React.ReactNode
}

const ErrorDisplay = ({ error }: { error: React.ReactNode | string }) => {
  if (typeof error === 'string') {
    return (
      <View flexDirection="row" alignItems="center" gap="$1">
        <SafeFontIcon color="$textColor" size={16} name="info" />
        <Text color="$textColor" fontWeight="600">
          {error}
        </Text>
      </View>
    )
  }
  return error
}

export function SafeInput({
  error,
  success,
  placeholder,
  height = 52,
  left,
  right,
  ...props
}: SafeInputProps & Omit<InputProps, 'left' | 'right'>) {
  const hasError = !!error

  return (
    <Theme name={`input_${getInputThemeName(hasError, success)}`}>
      <StyledInputContainer minHeight={height} testID="safe-input">
        {left}

        <StyledInput
          {...props}
          size="$5"
          flex={1}
          // maxHeight={height}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
        />
        {right}
      </StyledInputContainer>
      {hasError && <ErrorDisplay error={error} />}
    </Theme>
  )
}
