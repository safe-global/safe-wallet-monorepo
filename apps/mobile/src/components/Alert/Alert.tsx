import { View, Text, Theme } from 'tamagui'
import React, { type ReactElement } from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'
import { TouchableOpacity } from 'react-native'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  type: AlertType
  message: string
  info?: string
  iconName?: IconName
  displayIcon?: boolean
  fullWidth?: boolean
  endIcon?: React.ReactNode
  startIcon?: React.ReactNode
  onPress?: () => void
  testID?: string
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
}: AlertProps) => {
  const Icon = getAlertIcon(type, iconName, displayIcon)
  return (
    <Theme name={type}>
      <TouchableOpacity disabled={!onPress} onPress={onPress} testID={testID}>
        <View flexDirection="row" width="100%" justifyContent="center">
          <View
            alignItems="center"
            gap={'$3'}
            width={fullWidth ? '100%' : 'auto'}
            flexDirection="row"
            justifyContent="flex-start"
            backgroundColor="$background"
            paddingLeft="$4"
            paddingRight="$4"
            paddingVertical="$3"
            borderRadius={'$2'}
          >
            {startIcon ? <View testID="alert-start-icon">{startIcon}</View> : Icon}

            <View gap={'$1'} flex={1}>
              <Text fontSize={'$4'} fontWeight={'600'} fontFamily={'$body'}>
                {message}
              </Text>

              {info && (
                <Text fontSize={'$3'} fontFamily={'$body'}>
                  {info}
                </Text>
              )}
            </View>

            {endIcon && <View testID="alert-end-icon">{endIcon}</View>}
          </View>
        </View>
      </TouchableOpacity>
    </Theme>
  )
}
