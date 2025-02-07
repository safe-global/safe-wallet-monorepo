import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { formatWithSchema } from '@/src/utils/date'
import React from 'react'
import { ScrollView, Text, View } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

function Messages() {
  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView>
        <View paddingHorizontal="$3">
          <SafeListItem.Header title={formatWithSchema(Date.now(), 'MMM d, yyyy')} />
          <SafeListItem
            label={'Hello Web3Modal Eth'}
            leftNode={
              <View backgroundColor="$borderLightDark" padding="$2" borderRadius={100}>
                <SafeFontIcon name="sign" color="$colorSecondary" />
              </View>
            }
            rightNode={
              <View backgroundColor="#1D3D28" paddingHorizontal={'$3'} paddingVertical={'$1'} borderRadius={25}>
                <Text color={'$primary'}>Success</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
  },
})

export default Messages
