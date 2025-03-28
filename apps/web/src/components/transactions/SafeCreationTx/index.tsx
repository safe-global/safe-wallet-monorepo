import React from 'react'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box } from '@mui/system'
import css from './styles.module.css'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import EthHashInfo from '@/components/common/EthHashInfo'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { dateString } from '@safe-global/utils/utils/formatters'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { NOT_AVAILABLE } from '@/components/transactions/TxDetails'

type SafeCreationTxProps = {
  txSummary: TransactionSummary
}

const SafeCreationTx = ({ txSummary }: SafeCreationTxProps) => {
  if (!isCreationTxInfo(txSummary.txInfo)) return null

  const timestamp = txSummary.timestamp
  const { creator, factory, implementation, transactionHash } = txSummary.txInfo

  return (
    <>
      <Box className={css.txCreation}>
        <InfoDetails title="Creator:">
          <EthHashInfo address={creator.value} shortAddress={false} showCopyButton hasExplorer />
        </InfoDetails>
        <InfoDetails title="Factory:">
          {factory ? (
            <EthHashInfo name={factory.name} address={factory.value} shortAddress={false} showCopyButton hasExplorer />
          ) : (
            NOT_AVAILABLE
          )}
        </InfoDetails>
        <InfoDetails title="Mastercopy:">
          {implementation ? (
            <EthHashInfo
              name={implementation.name}
              address={implementation.value}
              shortAddress={false}
              showCopyButton
              hasExplorer
            />
          ) : (
            NOT_AVAILABLE
          )}
        </InfoDetails>
      </Box>
      <Box className={css.txSummary}>
        <TxDataRow title="Transaction hash:">{generateDataRowValue(transactionHash, 'hash', true)}</TxDataRow>
        <TxDataRow title="Created:">{timestamp ? dateString(timestamp) : null}</TxDataRow>
      </Box>
    </>
  )
}

export default SafeCreationTx
