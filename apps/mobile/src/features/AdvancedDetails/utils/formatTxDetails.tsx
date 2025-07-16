import React from 'react'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { CircleProps, Text, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { EthAddress } from '@/src/components/EthAddress'
import { Address } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'
import { Badge } from '@/src/components/Badge'
import { shortenText } from '@safe-global/utils/utils/formatters'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import { Receiver } from '../components/Receiver'
import { InfoSheet } from '@/src/components/InfoSheet'

interface formatTxDetailsProps {
  txDetails?: TransactionDetails
}

const badgeProps: CircleProps = { borderRadius: '$2', paddingHorizontal: '$2', paddingVertical: '$1' }
const characterDisplayLimit = 15

const formatTxDetails = ({ txDetails }: formatTxDetailsProps): ListTableItem[] => {
  const items: ListTableItem[] = []

  if (!txDetails) {
    return items
  }

  // Basic transaction info
  items.push({
    label: 'To',
    render: () => (
      <>
        <View width="100%">
          <Receiver txData={txDetails.txData} />
        </View>
        <View width="100%" flexDirection="row" alignItems="center" gap="$4">
          <Identicon address={txDetails.txData?.to.value as Address} size={24} />

          <View flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text flexWrap="wrap" width="77%">
              {txDetails.txData?.to.value}
            </Text>

            <View flexDirection="row" alignItems="center" gap="$3">
              <CopyButton value={txDetails.txData?.to.value || ''} size={14} color={'$textSecondaryLight'} />

              <TouchableOpacity onPress={() => null}>
                <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </>
    ),
  })

  // Value
  if (txDetails.txData?.value) {
    items.push({
      label: 'Value',
      render: () => <Text>{txDetails.txData?.value || '0'}</Text>,
    })
  }

  // Operation
  if (txDetails.txData?.operation !== undefined) {
    const operationText = txDetails.txData.operation === Operation.CALL ? '0 (call)' : '1 (delegate call)'
    items.push({
      label: 'Operation',
      render: () => (
        <Badge
          circleProps={badgeProps}
          themeName="badge_background"
          fontSize={12}
          circular={false}
          content={operationText}
        />
      ),
    })
  }

  // Gas details if available (for multisig transactions)
  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    const executionInfo = txDetails.detailedExecutionInfo

    items.push({
      label: 'SafeTxGas',
      render: () => <Text>{executionInfo.safeTxGas}</Text>,
    })

    items.push({
      label: 'BaseGas',
      render: () => <Text>{executionInfo.baseGas}</Text>,
    })

    items.push({
      label: 'GasPrice',
      render: () => <Text>{executionInfo.gasPrice}</Text>,
    })

    // Gas Token
    items.push({
      label: 'GasToken',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Identicon address={executionInfo.gasToken as Address} size={24} />
          <EthAddress address={executionInfo.gasToken as Address} copy copyProps={{ color: '$textSecondaryLight' }} />
        </View>
      ),
    })

    // Refund Receiver
    items.push({
      label: 'RefundReceiver',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$1">
          <Identicon address={executionInfo.refundReceiver.value as Address} size={24} />
          <EthAddress
            address={executionInfo.refundReceiver.value as Address}
            copy
            copyProps={{ color: '$textSecondaryLight' }}
          />
        </View>
      ),
    })

    // Nonce
    items.push({
      label: 'Nonce',
      render: () => <Text>{executionInfo.nonce}</Text>,
    })

    // Safe Tx Hash
    if (executionInfo.safeTxHash) {
      items.push({
        label: 'Safe Tx Hash',
        render: () => (
          <InfoSheet title="Safe Tx Hash" info={executionInfo.safeTxHash}>
            <View flexDirection="row" alignItems="center" gap="$1">
              <Text>{shortenText(executionInfo.safeTxHash || '', characterDisplayLimit)}</Text>
              <CopyButton value={executionInfo.safeTxHash || ''} color={'$textSecondaryLight'} text="Hash copied." />
            </View>
          </InfoSheet>
        ),
      })
    }
  }

  // Transaction Hash
  if (txDetails.txHash) {
    items.push({
      label: 'Transaction Hash',
      render: () => (
        <InfoSheet title="Transaction Hash" info={txDetails.txHash || ''}>
          <View flexDirection="row" alignItems="center" gap="$1">
            <Text>{shortenText(txDetails.txHash || '', characterDisplayLimit)}</Text>
            <CopyButton value={txDetails.txHash || ''} color={'$textSecondaryLight'} text="Hash copied." />
          </View>
        </InfoSheet>
      ),
    })
  }

  return items
}

export { formatTxDetails }
