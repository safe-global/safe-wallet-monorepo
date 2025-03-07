import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { isArrayParameter } from '@/src/utils/transaction-guards'
import { shortenText } from '@safe-global/utils/formatters'
import { CircleProps, Text, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { characterDisplayLimit, formatValueTemplate } from './formatters/singleValue'
import { formatArrayValue } from './formatters/arrayValue'
import { Badge } from '@/src/components/Badge'

interface formatParametersProps {
  txData: TransactionDetails['txData']
}
const badgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }

const formatParameters = ({ txData }: formatParametersProps): ListTableItem[] => {
  const items: ListTableItem[] = [
    {
      label: txData?.dataDecoded?.method ? 'Call' : 'Interacted with',
      render: () => (
        <Badge
          circleProps={badgeProps}
          themeName="badge_background"
          fontSize={12}
          circular={false}
          content={String(txData?.dataDecoded?.method || txData?.to.value)}
        />
      ),
    },
  ]

  const parameters = txData?.dataDecoded?.parameters

  if (parameters && parameters.length) {
    const formatedParameters = parameters.reduce<ListTableItem[]>((acc, param) => {
      const isArrayValueParam = isArrayParameter(param.type) || Array.isArray(param.value)

      if (isArrayValueParam) {
        acc.push(formatArrayValue(param))
        return acc
      }

      acc.push(formatValueTemplate(param))

      return acc
    }, [])

    items.push(...formatedParameters)
  }

  if (txData?.hexData) {
    items.push({
      label: 'Hex Data:',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text>{shortenText(txData?.hexData || '', characterDisplayLimit)}</Text>
          <CopyButton value={txData?.hexData || ''} color={'$textSecondaryLight'} text="Data copied." />
        </View>
      ),
    })
  }

  return items
}

export { formatParameters }
