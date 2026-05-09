import { H2, View } from 'tamagui'

const TransactionHeader = ({ title = 'Transactions' }: { title?: string }) => {
  return (
    <View>
      <H2 fontWeight={600} alignSelf="flex-start" width="100%" textAlign="left">
        {title}
      </H2>
    </View>
  )
}

export default TransactionHeader
