import React from 'react'
import { Text, Theme, View } from 'tamagui'
import type { GetProps } from 'tamagui'
import { StyledInput, StyledInputContainer } from './styled'
import { getInputThemeName } from './utils'
import { SafeFontIcon } from '../SafeFontIcon'

type StyledInputProps = GetProps<typeof StyledInput>

export interface SafeInputProps {
  error?: React.ReactNode | string
  placeholder?: string
  height?: number
  success?: boolean
  left?: React.ReactNode
  right?: React.ReactNode
  editable?: boolean
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
  editable,
  ...props
}: SafeInputProps & Omit<StyledInputProps, 'left' | 'right' | 'editable'>) {
  const hasError = !!error

  return (
    <Theme name={`input_${getInputThemeName(hasError, success)}`}>
      <StyledInputContainer minHeight={height} testID="safe-input">
        {left ? <View paddingLeft={'$3'}>{left}</View> : null}

        <StyledInput
          {...props}
          size="$5"
          flex={1}
          autoCapitalize="none"
          paddingHorizontal={'$3'}
          autoCorrect={false}
          placeholder={placeholder}
          {...(editable === false ? { readOnly: true } : {})}
        />
        {right ? <View paddingHorizontal={'$3'}>{right}</View> : null}
      </StyledInputContainer>
      {hasError && <ErrorDisplay error={error} />}
    </Theme>
  )
}
