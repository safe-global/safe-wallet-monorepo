import { Input, InputProps, styled, View, Text, Theme } from 'tamagui'
import React from 'react'

interface Props {
  label: string
  error?: boolean
  placeholder?: string
  success?: boolean
  left?: React.ReactNode
  right?: React.ReactNode
  testID?: string
}

const StyledInputContainer = styled(View, {
  borderWidth: 2,
  borderRadius: '$4',
  borderColor: 'transparent',
  flex: 1,
  paddingHorizontal: '$3',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  marginBottom: '$3',
  padding: '$3',
  backgroundColor: '$background',

  variants: {
    error: {
      true: {
        borderWidth: 2,
        borderColor: '$error',
      },
    },
    success: {
      true: {
        borderWidth: 2,
        borderColor: '$success',
      },
    },
  },
})

const StyledInput = styled(Input, {
  color: '$inputTextColor',
  placeholderTextColor: '$placeholderColor',
  borderWidth: 0,

  style: {
    borderWidth: 0,
    backgroundColor: '$borderColorHover',
    paddingLeft: 0,
  },
})
export const SafeInputWithLabel = ({
  label,
  testID,
  error,
  success,
  placeholder,
  left,
  right,
  ...props
}: Props & Omit<InputProps, 'left' | 'right'>) => {
  return (
    <Theme name={'input_with_label'}>
      <StyledInputContainer
        testID={testID ? testID : 'safe-input-with-label'}
        success={success}
        error={error}
        gap={'$1'}
      >
        <View flex={1} flexDirection="row" alignItems="center">
          {left ? <View marginRight={'$2'}>{left}</View> : null}

          <View flex={1}>
            <Text color={'$colorSecondary'}>{label}</Text>
            <View flex={1} flexDirection="row" alignItems="center">
              <StyledInput size="$5" flex={1} placeholder={placeholder} {...props} />
            </View>
          </View>

          {right ? <View marginLeft={'$2'}>{right}</View> : null}
        </View>
      </StyledInputContainer>
    </Theme>
  )
}
