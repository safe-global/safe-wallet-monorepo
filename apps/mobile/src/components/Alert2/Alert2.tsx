import { View, Text, Theme } from 'tamagui'
import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { IconName } from '@/src/types/iconTypes'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

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

export interface Alert2Props {
  type: AlertType
  title: string
  message: string
  iconName?: IconName
  testID?: string
}

export const Alert2 = ({ type, title, message, iconName, testID }: Alert2Props) => {
  const Icon = iconName ? <SafeFontIcon testID={`${iconName}-icon`} name={iconName} /> : icons[type]

  return (
    <Theme name={type}>
      <View
        flexDirection="row"
        alignItems="flex-start"
        gap="$3"
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$2"
        testID={testID}
      >
        <View testID="alert-start-icon" alignItems="center" justifyContent="center">
          {Icon}
        </View>

        <View flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" fontFamily="$body">
            {title}
          </Text>
          <Text fontSize="$3" fontFamily="$body">
            {message}
          </Text>
        </View>
      </View>
    </Theme>
  )
}
