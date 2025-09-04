import React from 'react'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { Text, View } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { Address } from '@/src/types/address'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { HashDisplay } from '@/src/components/HashDisplay'
import { Badge } from '@/src/components/Badge'
import { HexDataDisplay } from '@/src/components/HexDataDisplay'

interface formatHistoryTxDetailsProps {
  txDetails?: TransactionDetails
}

export interface HistoryTxDetailsSection {
  title?: string
  items: ListTableItem[]
}

const formatHistoryTxDetails = ({ txDetails }: formatHistoryTxDetailsProps): HistoryTxDetailsSection[] => {
  const sections: HistoryTxDetailsSection[] = []

  if (!txDetails) {
    return sections
  }

  // Section 1: Basic Transaction Info (Nonce, safeTxHash)
  const basicInfoItems: ListTableItem[] = []

  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    const executionInfo = txDetails.detailedExecutionInfo

    basicInfoItems.push({
      label: 'Nonce',
      render: () => <Text>{executionInfo.nonce}</Text>,
    })

    // Safe Tx Hash
    if (executionInfo.safeTxHash) {
      basicInfoItems.push({
        label: 'safeTxHash',
        render: () => (
          <HashDisplay
            value={executionInfo.safeTxHash as Address}
            showVisualIdentifier={false}
            showExternalLink={false}
          />
        ),
      })
    }
  }

  if (basicInfoItems.length > 0) {
    sections.push({
      items: basicInfoItems,
    })
  }

  // Section 2: Parameters
  const parametersItems: ListTableItem[] = []

  if (txDetails.txData?.operation !== undefined && txDetails.txData.dataDecoded?.method) {
    const methodCalled = txDetails.txData.dataDecoded?.method
    parametersItems.push({
      label: txDetails.txData.operation === Operation.CALL ? 'Call' : 'Delegate Call',
      render: () => (
        <Badge
          circular={false}
          content={methodCalled}
          themeName="badge_background"
          circleProps={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 }}
        />
      ),
    })
  }

  if (txDetails.txData?.to?.value) {
    parametersItems.push({
      label: 'To',
      render: () => <HashDisplay value={txDetails.txData?.to.value as Address} />,
    })
  }

  if (txDetails.txData?.value) {
    parametersItems.push({
      label: 'Value',
      render: () => <Text>{txDetails.txData?.value}</Text>,
    })
  }

  parametersItems.push({
    label: 'Data',
    render: () => {
      if (!txDetails.txData?.hexData) {
        return <Text fontWeight={600}>0x</Text>
      }

      return <HexDataDisplay data={txDetails.txData?.hexData || '0x'} title="Hex Data" copyMessage="Data copied." />
    },
  })

  if (parametersItems.length > 0) {
    sections.push({
      title: 'Parameters',
      items: parametersItems,
    })
  }

  // Section 3: Decoded data
  const decodedDataItems: ListTableItem[] = []

  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    const executionInfo = txDetails.detailedExecutionInfo

    if (txDetails.txData?.operation !== undefined) {
      const operationText = txDetails.txData.operation === Operation.CALL ? '0 (call)' : '1 (delegateCall)'
      decodedDataItems.push({
        label: 'Operation',
        render: () => <Text>{operationText}</Text>,
      })
    }

    decodedDataItems.push({
      label: 'safeTxGas',
      render: () => <Text>{executionInfo.safeTxGas}</Text>,
    })

    decodedDataItems.push({
      label: 'baseGas',
      render: () => <Text>{executionInfo.baseGas}</Text>,
    })

    decodedDataItems.push({
      label: 'gasPrice',
      render: () => <Text>{executionInfo.gasPrice}</Text>,
    })

    decodedDataItems.push({
      label: 'gasToken',
      render: () => <Text>{executionInfo.gasToken}</Text>,
    })

    decodedDataItems.push({
      label: 'refundReceiver',
      render: () => <Text>{executionInfo.refundReceiver.value}</Text>,
    })

    if (executionInfo.confirmations && executionInfo.confirmations.length > 0) {
      executionInfo.confirmations.forEach((confirmation, index) => {
        if (confirmation.signature) {
          decodedDataItems.push({
            label: `Signature ${index + 1}`,
            render: () => (
              <View flexDirection="row" alignItems="center" gap="$1">
                <Text>{confirmation.signature ? `${confirmation.signature.length / 2 - 1} bytes` : '0 bytes'}</Text>
                {confirmation.signature && (
                  <CopyButton value={confirmation.signature} color={'$textSecondaryLight'} text="Signature copied." />
                )}
              </View>
            ),
          })
        }
      })
    }

    if (txDetails.txData?.hexData) {
      decodedDataItems.push({
        label: 'Raw data',
        render: () => (
          <HexDataDisplay data={txDetails.txData?.hexData} title="Raw Data" copyMessage="Raw data copied." />
        ),
      })
    }
  }

  if (decodedDataItems.length > 0) {
    sections.push({
      title: 'Decoded data',
      items: decodedDataItems,
    })
  }

  return sections
}

export { formatHistoryTxDetails }
