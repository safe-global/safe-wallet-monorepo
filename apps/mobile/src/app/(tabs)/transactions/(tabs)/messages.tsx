import React from 'react'
import { H5, Text, View } from 'tamagui'

/*
 * Since the messages are not implemented yet, we showing a Comming Soon message
 * The messages will be implemented in a future PR
 */
function Messages() {
  return (
    <View flex={1} alignItems="center" gap="$2" justifyContent="center">
      <H5 color="$colorPrimary" fontWeight={600}>
        The view isn’t ready yet
      </H5>
      <Text color="$colorSecondary" textAlign="center">
        We’re working on this transaction view. Details aren’t available just yet—but they will be soon.
      </Text>
    </View>
  )
}

export default Messages
