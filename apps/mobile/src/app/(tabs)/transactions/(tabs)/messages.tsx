import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { ComingSoon } from '@/src/components/ComingSoon/ComingSoon'

/*
 * Since the messages are not implemented yet, we showing a Comming Soon message
 * The messages will be implemented in a future PR
 */

function Messages() {
  return (
    <SafeAreaView style={styles.wrapper} testID={'messages-tab-content'}>
      <ComingSoon />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
})

export default Messages
