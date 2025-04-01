import React from 'react'
import { Switch, StyleSheet } from 'react-native'
import { View } from 'tamagui'
import { CircleSnail } from 'react-native-progress'

interface LoadableSwitchProps {
  isLoading?: boolean
  value: boolean
  onChange: () => void
  testID?: string
  trackColor?: {
    true: string
    false?: string
  }
}

export const LoadableSwitch: React.FC<LoadableSwitchProps> = ({
  isLoading = false,
  value,
  onChange,
  testID,
  trackColor = { true: '$primary' },
}) => {
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <CircleSnail size={24} color={value ? trackColor.true : '#ccc'} />
      </View>
    )
  }

  return <Switch testID={testID} onChange={onChange} value={value} trackColor={trackColor} />
}

const styles = StyleSheet.create({
  loaderContainer: {
    width: 51,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
