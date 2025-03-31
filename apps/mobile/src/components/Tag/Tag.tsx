import { styled, Text } from 'tamagui'

export const Tag = styled(Text, {
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignSelf: 'flex-start',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$4',

  color: '$color',

  variants: {
    success: {
      true: {
        backgroundColor: '$backgroundSuccess',
        color: '$success',
      },
    },
    warning: {
      true: {
        backgroundColor: '$backgroundWarning',
        color: '$warning',
      },
    },
    error: {
      true: {
        backgroundColor: '$backgroundError',
        color: '$error',
      },
    },
    outlined: {
      true: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$colorOutline',
        color: '$colorOutline',
      },
    },
  },
})
