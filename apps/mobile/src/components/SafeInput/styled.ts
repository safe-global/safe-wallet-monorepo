import { Input, styled, View } from 'tamagui'
import type { ColorTokens } from 'tamagui'

export const StyledInputContainer = styled(View, {
  borderWidth: 1,
  borderRadius: '$4',
  borderColor: '$borderColor',
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$3',
  backgroundColor: '$containerBackgroundColor',

  variants: {
    error: {
      true: {
        borderWidth: 1,
      },
    },
  },
})

export const StyledInput = styled(Input, {
  color: '$inputTextColor',
  placeholderTextColor: '$placeholderColor' as ColorTokens,
  backgroundColor: '$inputBackgroundColor',
  borderWidth: 0,

  style: {
    lineHeight: 20.5,
    paddingTop: 0,
    paddingBottom: 0,
  },
})
