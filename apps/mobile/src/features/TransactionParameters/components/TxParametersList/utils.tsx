import { DataDecodedParameter, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { isArrayParameter } from '@/src/utils/transaction-guards'
import { shortenText } from '@safe-global/utils/formatters'
import { Text, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { EthAddress } from '@/src/components/EthAddress'
import { Address } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'
interface formatParametersProps {
  txData: TransactionDetails['txData']
}

const textDisplayLimit = 15

const formatValueTemplate = (param: DataDecodedParameter): ListTableItem => {
  if (param.value == undefined || typeof param.value !== 'string') {
    return {
      label: param.name,
    }
  }

  switch (param.type) {
    case 'hash':
    case 'address':
      return {
        label: param.name,
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$1">
            <Identicon address={String(param.value) as Address} size={24} />
            <EthAddress address={String(param.value) as Address} copy copyProps={{ color: '$textSecondaryLight' }} />
          </View>
        ),
      }
    case 'rawData':
    case 'bytes':
      return {
        label: param.name,
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$1">
            <Text>{shortenText(String(param.value), textDisplayLimit)}</Text>
            <CopyButton value={String(param.value)} color={'$textSecondaryLight'} text="Data copied." />
          </View>
        ),
      }
    default:
      return {
        label: param.name,
        render: () => (
          <View flexDirection="row" alignItems="center" gap="$1">
            <Text>{shortenText(String(param.value), textDisplayLimit)}</Text>
            {String(param.value).length > textDisplayLimit && (
              <CopyButton value={String(param.value)} color={'$textSecondaryLight'} text="Data copied." />
            )}
          </View>
        ),
      }
  }
}

const formatParameters = ({ txData }: formatParametersProps): ListTableItem[] => {
  const items: ListTableItem[] = [
    {
      label: txData?.dataDecoded?.method ? 'Method' : 'Interacted with',
      value: txData?.dataDecoded?.method || txData?.to.value,
    },
  ]

  const parameters = txData?.dataDecoded?.parameters

  if (parameters && parameters.length) {
    const formatedParameters = parameters.reduce<ListTableItem[]>((acc, param) => {
      const isArrayValueParam = isArrayParameter(param.type) || Array.isArray(param.value)

      if (isArrayValueParam) {
        return acc
      }

      acc.push(formatValueTemplate(param))

      return acc
    }, [])

    items.push(...formatedParameters)
  } else if (txData?.hexData) {
    items.push({
      label: 'Hex Data:',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text>{shortenText(txData?.hexData || '', textDisplayLimit)}</Text>
          <CopyButton value={txData?.hexData || ''} color={'$textSecondaryLight'} text="Data copied." />
        </View>
      ),
    })
  }

  return items
}

export { formatParameters }
