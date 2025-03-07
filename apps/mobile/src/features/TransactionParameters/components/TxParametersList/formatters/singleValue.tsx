import { DataDecodedParameter } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { shortenText } from '@safe-global/utils/formatters'
import { Text, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { EthAddress } from '@/src/components/EthAddress'
import { Address } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'

export const characterDisplayLimit = 15

export const DisplayValue = ({ type, value }: { type: string; value: string }) => {
  const isLong = value.length > characterDisplayLimit

  switch (type) {
    case 'hash':
    case 'address':
      return (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Identicon address={value as Address} size={24} />
          <EthAddress address={value as Address} copy copyProps={{ color: '$textSecondaryLight' }} />
        </View>
      )
    case 'rawData':
    case 'bytes':
      return (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text>{shortenText(value, characterDisplayLimit)}</Text>
          <CopyButton value={value} color={'$textSecondaryLight'} text="Data copied." />
        </View>
      )
    default:
      return (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text>{isLong ? shortenText(value, characterDisplayLimit) : value}</Text>
          {isLong && <CopyButton value={value} color={'$textSecondaryLight'} text="Data copied." />}
        </View>
      )
  }
}

export const formatValueTemplate = (param: DataDecodedParameter): ListTableItem => {
  if (param.value == undefined || typeof param.value !== 'string') {
    return {
      label: param.name,
    }
  }

  return {
    label: param.name,
    render: () => <DisplayValue type={param.type} value={String(param.value)} />,
  }
}
