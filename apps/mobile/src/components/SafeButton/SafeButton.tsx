import { styled, Button } from 'tamagui'

export const SafeButton = styled(Button, {
  variants: {
    rounded: {
      true: {
        borderRadius: 8,
      },
    },

    circle: {
      true: {
        borderRadius: 100,
        height: 50,
        width: 50,
        padding: 17,
      },
    },

    danger: {
      true: {
        backgroundColor: '$errorBackground',
        color: '$error',
      },
    },

    success: {
      true: {
        backgroundColor: '$success',
        color: '$color',
      },
    },

    primary: {
      true: {
        backgroundColor: '$primary',
        color: '$contrast',
      },
    },

    secondary: {
      true: {
        backgroundColor: '$backgroundSecondary',
        color: '$color',
      },
    },

    outlined: {
      true: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$color',
        color: '$color',
      },
    },

    text: {
      true: {
        backgroundColor: 'transparent',
        color: '$primary',
      },
    },

    disabled: {
      true: (_, allProps) => {
        // @ts-expect-error
        const isText = allProps.props?.text === true
        return {
          backgroundColor: isText ? 'transparent' : '$backgroundDisabled',
          color: '$colorLight',
        }
      },
    },

    size: {
      $md: () => ({
        height: 'auto',
        paddingVertical: 14,
        paddingHorizontal: 20,
        margin: 0,
        fontWeight: 600,
        letterSpacing: -0.1,
        fontSize: 14,
        scaleIcon: 0.9,
        scaleSpace: 0.3,
        textProps: {
          marginBottom: -2.5,
        },
      }),
      $sm: () => ({
        height: 36,
        paddingVertical: '$2',
        paddingHorizontal: '$3',
        fontWeight: 600,
        scaleIcon: 0.8,
        scaleSpace: 0.2,
        textProps: {
          marginBottom: -2.5,
        },
      }),
    },
  } as const,
  defaultVariants: {
    size: '$md',
    rounded: true,
    primary: true,
  },
})
