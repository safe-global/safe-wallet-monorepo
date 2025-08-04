import { Text, View } from 'tamagui'
import { Tabs } from 'react-native-collapsible-tab-view'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Container } from '@/src/components/Container'
import { CopyButton } from '@/src/components/CopyButton'
import useSafeTx from '@/src/hooks/useSafeTx'

interface JSONTabProps {
  txDetails: TransactionDetails
}

export function JSONTab({ txDetails }: JSONTabProps) {
  const safeTx = useSafeTx(txDetails)
  const jsonData = safeTx ? JSON.stringify(safeTx.data, null, 2) : undefined

  if (!jsonData) {
    return null
  }

  return (
    <Tabs.ScrollView contentContainerStyle={{ padding: 16, marginTop: 16 }}>
      <Container>
        <View position="absolute" right={10} top={10} zIndex={1000}>
          <CopyButton value={jsonData} color="$colorSecondary" size={16} text="JSON value copied to clipboard" />
        </View>
        <Text>{jsonData}</Text>
      </Container>
    </Tabs.ScrollView>
  )
}
