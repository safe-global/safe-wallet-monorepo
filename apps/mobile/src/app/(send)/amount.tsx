import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EnterAmountContainer } from '@/src/features/Send'

function AmountScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={bottom}>
      <EnterAmountContainer />
    </View>
  )
}

export default AmountScreen
