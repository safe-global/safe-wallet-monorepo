import type { ReactNode } from 'react'
import css from './styles.module.css'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import { dateString } from '@safe-global/utils/utils/formatters'

export type SafeCreationTxViewProps = {
  creator: ReactNode
  factory?: ReactNode
  implementation?: ReactNode
  notAvailable: string
  transactionHash: ReactNode
  timestamp?: number
}

export const SafeCreationTxView = ({
  creator,
  factory,
  implementation,
  notAvailable,
  transactionHash,
  timestamp,
}: SafeCreationTxViewProps) => {
  return (
    <>
      <div className={css.txCreation}>
        <InfoDetails title="Creator:">{creator}</InfoDetails>
        <InfoDetails title="Factory:">{factory ? factory : notAvailable}</InfoDetails>
        <InfoDetails title="Mastercopy:">{implementation ? implementation : notAvailable}</InfoDetails>
      </div>
      <div className={css.txSummary}>
        <TxDataRow title="Transaction hash:">{transactionHash}</TxDataRow>
        <TxDataRow title="Created:">{timestamp ? dateString(timestamp) : null}</TxDataRow>
      </div>
    </>
  )
}
