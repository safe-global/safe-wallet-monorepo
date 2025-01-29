import { Input, styled, View } from 'tamagui'

export const StyledInputContainer = styled(View, {
  borderWidth: 2,
  borderRadius: '$4',
  borderColor: '$borderColor',
  flex: 1,
  flexDirection: 'row',
  paddingHorizontal: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$3',
  backgroundColor: '$containerBackgroundColor',

  variants: {
    error: {
      true: {
        borderWidth: 2,
      },
    },
  },
})

export const StyledInput = styled(Input, {
  color: '$inputTextColor',
  placeholderTextColor: '$placeholderColor',
  backgroundColor: '$inputBackgroundColor',
  borderWidth: 0,
})
