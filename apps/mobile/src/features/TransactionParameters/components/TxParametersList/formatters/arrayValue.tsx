import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ReactElement } from 'react'
import { Text, View } from 'tamagui'
import { shortenText } from '@safe-global/utils/utils/formatters'
import { CopyButton } from '@/src/components/CopyButton'

const renderArrayValue = (value: object, index?: number): ReactElement => {
  const displayLimit = 30

  if (Array.isArray(value)) {
    return (
      <View key={`array-${index}`}>
        <Text>[</Text>
        <View marginLeft={'$2'}>{value.map(renderArrayValue)}</View>
        <Text>]</Text>
      </View>
    )
  }
  return (
    <View key={`value-${value}-${index}`} flexDirection="row" alignItems="center" gap="$1">
      <Text>{shortenText(String(value), displayLimit)}</Text>
      <CopyButton value={String(value)} color={'$textSecondaryLight'} text="Data copied." />
    </View>
  )
}

export const formatArrayValue = (param: DataDecodedParameter): ListTableItem => {
  return {
    label: param.name,
    render: () => renderArrayValue(param.value),
    direction: 'column',
    alignItems: 'flex-start',
  }
}
