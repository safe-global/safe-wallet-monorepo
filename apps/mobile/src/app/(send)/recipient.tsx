import { View } from 'tamagui'
import { SelectRecipientContainer } from '@/src/features/Send'

function RecipientScreen() {
  return (
    <View flex={1}>
      <SelectRecipientContainer />
    </View>
  )
}

export default RecipientScreen
