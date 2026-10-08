import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { NOT_AVAILABLE } from '@/components/transactions/TxDetails'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { SafeCreationTxView } from '@views/components/transactions/SafeCreationTx/SafeCreationTxView'

type SafeCreationTxProps = {
  txSummary: Transaction
}

const SafeCreationTx = ({ txSummary }: SafeCreationTxProps) => {
  if (!isCreationTxInfo(txSummary.txInfo)) return null

  const timestamp = txSummary.timestamp
  const { creator, factory, implementation, transactionHash } = txSummary.txInfo

  return (
    <SafeCreationTxView
      creator={
        <NamedAddressInfo address={creator.value} name={creator.name} shortAddress={false} showCopyButton hasExplorer />
      }
      factory={
        factory && (
          <EthHashInfo name={factory.name} address={factory.value} shortAddress={false} showCopyButton hasExplorer />
        )
      }
      implementation={
        implementation && (
          <EthHashInfo
            name={implementation.name}
            address={implementation.value}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        )
      }
      notAvailable={NOT_AVAILABLE}
      transactionHash={generateDataRowValue(transactionHash, 'hash', true)}
      timestamp={timestamp}
    />
  )
}

export default SafeCreationTx
