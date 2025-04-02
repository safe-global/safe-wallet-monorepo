import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { ComingSoon } from '@/src/components/ComingSoon/ComingSoon'
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
  },
})

export default Messages
