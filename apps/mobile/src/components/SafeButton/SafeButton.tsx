import React from 'react'
import { styled, Button } from 'tamagui'
import { Loader } from '@/src/components/Loader'

// Create base styled button
// Test change to trigger mobile Storybook screenshot workflow
const BaseButton = styled(Button, {
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
        borderColor: '$backgroundSecondary',
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
      $xl: () => ({
        fontSize: 14,
        fontWeight: 700,
        height: 'auto',
        margin: 0,
        paddingVertical: '$3',
        textProps: {
          lineHeight: 24,
        },
      }),
      $md: () => ({
        height: 'auto',
        paddingVertical: 14,
        paddingHorizontal: 20,
        margin: 0,
        fontWeight: 700,
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

// Extended props to support loading state
export interface SafeButtonProps extends React.ComponentProps<typeof BaseButton> {
  loading?: boolean
  loadingText?: string
}

// Wrapper component that handles loading state
export const SafeButton = React.forwardRef<React.ElementRef<typeof BaseButton>, SafeButtonProps>(
  ({ loading = false, loadingText, children, disabled, icon, ...props }, ref) => {
    const buttonText = loading && loadingText ? loadingText : children
    const buttonIcon = loading ? <Loader size={16} thickness={1} /> : icon
    const isDisabled = loading || disabled

    return (
      <BaseButton ref={ref} disabled={isDisabled} icon={buttonIcon} {...props}>
        {buttonText}
      </BaseButton>
    )
  },
)

SafeButton.displayName = 'SafeButton'
