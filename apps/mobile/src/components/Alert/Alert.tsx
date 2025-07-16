import { View, Text, Theme } from 'tamagui'
import React, { type ReactElement } from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'
import { TouchableOpacity } from 'react-native'

export type AlertType = 'error' | 'warning' | 'info' | 'success'
export type AlertOrientation = 'left' | 'center' | 'right'

interface AlertProps {
  type: AlertType
  message: string | React.ReactNode
  info?: string | React.ReactNode
  iconName?: IconName
  displayIcon?: boolean
  fullWidth?: boolean
  endIcon?: React.ReactNode
  startIcon?: React.ReactNode
  onPress?: () => void
  testID?: string
  orientation?: AlertOrientation
}

const icons = {
  error: <SafeFontIcon testID="error-icon" name={'alert'} />,
  warning: (
    <View
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="$1"
      borderRadius={'$10'}
      backgroundColor="#FF8C00"
    >
      <SafeFontIcon testID="warning-icon" name={'alert'} color={'$colorContrast'} size={16} />
    </View>
  ),
  info: <SafeFontIcon testID="info-icon" name={'info'} />,
  success: <SafeFontIcon testID="success-icon" name={'check'} />,
}

const getAlertIcon = (type: AlertType, iconName?: IconName, displayIcon?: boolean): ReactElement | null => {
  if (!displayIcon) {
    return null
  }

  return iconName ? <SafeFontIcon testID={`${iconName}-icon`} name={iconName} /> : icons[type]
}

const getContainerAlignment = (orientation: AlertOrientation) => {
  switch (orientation) {
    case 'left':
      return 'flex-start'
    case 'right':
      return 'flex-end'
    case 'center':
    default:
      return 'center'
  }
}

const getContentAlignment = (orientation: AlertOrientation) => {
  switch (orientation) {
    case 'left':
      return 'flex-start'
    case 'right':
      return 'flex-start' // Still flex-start for content alignment, but container will be aligned right
    case 'center':
    default:
      return 'center'
  }
}

export const Alert = ({
  type,
  fullWidth = true,
  message,
  iconName,
  startIcon,
  endIcon,
  displayIcon = true,
  onPress,
  testID,
  info,
  orientation = 'center',
}: AlertProps) => {
  const Icon = getAlertIcon(type, iconName, displayIcon)
  const containerAlignment = getContainerAlignment(orientation)
  const contentAlignment = getContentAlignment(orientation)

  return (
    <Theme name={type}>
      <TouchableOpacity disabled={!onPress} onPress={onPress} testID={testID}>
        <View flexDirection="row" width="100%" justifyContent={containerAlignment}>
          <View
            alignItems="center"
            gap={'$3'}
            width={fullWidth ? '100%' : 'auto'}
            flexDirection="row"
            justifyContent={contentAlignment}
            backgroundColor="$background"
            padding="$2"
            borderRadius={'$2'}
          >
            {startIcon ? <View testID="alert-start-icon">{startIcon}</View> : Icon}

            <View gap={'$1'} flex={orientation !== 'center' ? 1 : undefined}>
              {typeof message === 'string' ? <AlertTitleStyled message={message} /> : message}
              {info && typeof info === 'string' ? (
                <Text fontSize={'$3'} fontFamily={'$body'}>
                  {info}
                </Text>
              ) : (
                info
              )}
            </View>

            {endIcon && <View testID="alert-end-icon">{endIcon}</View>}
          </View>
        </View>
      </TouchableOpacity>
    </Theme>
  )
}

export const AlertTitleStyled = ({ message }: { message: string }) => {
  if (typeof message === 'string') {
    return (
      <Text fontSize={'$4'} fontWeight={'600'} fontFamily={'$body'}>
        {message}
      </Text>
    )
  }

  return message
}
