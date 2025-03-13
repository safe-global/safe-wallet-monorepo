import React from 'react'
import { Link, Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { Text, H1 } from 'tamagui'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <H1>This screen doesn't exist.</H1>
        <Link href="/" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
})
