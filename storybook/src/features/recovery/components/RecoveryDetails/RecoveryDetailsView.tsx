import type { ReactElement, ReactNode } from 'react'

import { dateString } from '@safe-global/utils/utils/formatters'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import classNames from 'classnames'

import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'

export type RecoveryDetailsViewProps = {
  timestamp: bigint
  validFrom: bigint
  expiresAt: bigint | null
  description: ReactNode
  signers: ReactNode
  transactionHashValue: ReactNode
  moduleValue: ReactNode
  valueValue: ReactNode
  operationValue: ReactNode
  rawDataValue: ReactNode
  renderAccordion: (children: ReactElement) => ReactNode
}

export function RecoveryDetailsView({
  timestamp,
  validFrom,
  expiresAt,
  description,
  signers,
  transactionHashValue,
  moduleValue,
  valueValue,
  operationValue,
  rawDataValue,
  renderAccordion,
}: RecoveryDetailsViewProps): ReactElement {
  return (
    <div className={classNames(txDetailsCss.container, txDetailsCss.containerContrast)}>
      <div className={txDetailsCss.details}>
        <div className={txDetailsCss.txData}>{description}</div>

        <div className={txDetailsCss.txSummary}>
          <TxDataRow title="Transaction hash">{transactionHashValue}</TxDataRow>
          <TxDataRow title="Created">
            <div className="text-sm">{dateString(Number(timestamp))}</div>
          </TxDataRow>
          <TxDataRow title="Executable">
            <div className="text-sm">{dateString(Number(validFrom))}</div>
          </TxDataRow>

          {expiresAt !== null && (
            <TxDataRow title="Expires">
              <div className="text-sm">{dateString(Number(expiresAt))}</div>
            </TxDataRow>
          )}

          <div className="mt-4">
            {renderAccordion(
              <div className="flex flex-col gap-2">
                <TxDataRow title="Module">{moduleValue}</TxDataRow>
                <TxDataRow title="Value">{valueValue}</TxDataRow>
                <TxDataRow title="Operation">{operationValue}</TxDataRow>
                <TxDataRow title="Raw data">{rawDataValue}</TxDataRow>
              </div>,
            )}
          </div>
        </div>
      </div>

      <div className={txDetailsCss.txSigners}>{signers}</div>
    </div>
  )
}
