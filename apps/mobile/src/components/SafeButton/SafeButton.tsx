import React, { isValidElement, cloneElement } from 'react'
import { styled, Button, useTheme } from 'tamagui'
import type { GetProps } from 'tamagui'
import { Loader } from '@/src/components/Loader'

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
      },
    },

    success: {
      true: {
        backgroundColor: '$success',
      },
    },

    primary: {
      true: {
        backgroundColor: '$primary',
      },
    },

    secondary: {
      true: {
        backgroundColor: '$backgroundSecondary',
      },
    },

    outlined: {
      true: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$backgroundSecondary',
      },
    },

    text: {
      true: {
        backgroundColor: 'transparent',
      },
    },

    disabled: {
      true: (_, allProps) => {
        // @ts-expect-error accessing text prop from allProps
        const isText = allProps.props?.text === true
        return {
          backgroundColor: isText ? 'transparent' : '$backgroundDisabled',
        }
      },
    },

    size: {
      $xl: () => ({
        height: 'auto',
        margin: 0,
        paddingVertical: '$3',
        gap: 4,
      }),
      $md: () => ({
        height: 'auto',
        paddingVertical: 14,
        paddingHorizontal: 20,
        margin: 0,
        gap: 4,
      }),
      $sm: () => ({
        height: 36,
        paddingVertical: '$2',
        paddingHorizontal: '$3',
        gap: 4,
      }),
    },
  } as const,
  defaultVariants: {
    size: '$md',
    rounded: true,
    primary: true,
  },
})

export interface SafeButtonProps extends GetProps<typeof BaseButton> {
  loading?: boolean
  loadingText?: string
}

function useTextColor(props: Record<string, unknown>): string {
  const theme = useTheme()
  if (props.disabled) {
    return theme.colorSecondary?.val
  }
  if (props.danger) {
    return theme.error?.val
  }
  if (props.primary) {
    return theme.contrast?.val
  }
  if (props.secondary) {
    return theme.color?.val
  }
  if (props.outlined) {
    return theme.color?.val
  }
  if (props.text) {
    return theme.color?.val
  }
  if (props.success) {
    return theme.color?.val
  }
  return theme.contrast?.val
}

const TYPE_VARIANTS = ['primary', 'secondary', 'danger', 'success', 'outlined', 'text'] as const

export const SafeButton = React.forwardRef<React.ElementRef<typeof BaseButton>, SafeButtonProps>(
  ({ loading = false, loadingText, children, disabled, icon, iconAfter, ...props }, ref) => {
    const buttonText = loading && loadingText ? loadingText : children
    const buttonIcon = loading ? <Loader size={16} thickness={1} /> : icon
    const isDisabled = loading || disabled
    const textColor = useTextColor({ ...props, disabled: isDisabled })

    // Strip type variants when disabled so disabled bg takes effect
    const frameProps = isDisabled
      ? Object.fromEntries(Object.entries(props).filter(([key]) => !(TYPE_VARIANTS as readonly string[]).includes(key)))
      : props

    // Colorize icons
    const iconOverrides = { color: textColor, size: 16 } as Record<string, unknown>
    const coloredIcon = buttonIcon && isValidElement(buttonIcon) ? cloneElement(buttonIcon, iconOverrides) : buttonIcon
    const coloredIconAfter = iconAfter && isValidElement(iconAfter) ? cloneElement(iconAfter, iconOverrides) : iconAfter

    return (
      <BaseButton ref={ref} disabled={isDisabled} {...frameProps}>
        {coloredIcon}
        <Button.Text
          fontFamily="$button"
          fontWeight="600"
          fontSize={14}
          lineHeight={20}
          letterSpacing={-0.1}
          color={textColor}
        >
          {buttonText}
        </Button.Text>
        {coloredIconAfter}
      </BaseButton>
    )
  },
)

SafeButton.displayName = 'SafeButton'
