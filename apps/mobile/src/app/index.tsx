import React from 'react'
import { View } from 'tamagui'
import { ActivityIndicator } from 'react-native'

/**
 * This is a dummy screen. Expo automatically renders it when it constructs the app.
 * If we don't have an index file it will pick whatever it sees fit. This is a placeholder.
 *
 * The actual navigation to either onboarding flow or a safe happens inside the NavigationGuardHOC
 *
 * @constructor
 */
function IndexScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}

export default IndexScreen
