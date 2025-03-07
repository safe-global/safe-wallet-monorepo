import { TxHistoryContainer } from '@/src/features/TxHistory'
import { View } from 'react-native'

export default function TransactionsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <TxHistoryContainer />
    </View>
  )
}
