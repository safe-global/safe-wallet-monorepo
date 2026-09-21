import { Operation } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'

import { dateString } from '@safe-global/utils/utils/formatters'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import RecoverySigners from '../RecoverySigners'
import RecoveryDescription from '../RecoveryDescription'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import classNames from 'classnames'

import txDetailsCss from '@/components/transactions/TxDetails/styles.module.css'

export default function RecoveryDetails({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { transactionHash, timestamp, validFrom, expiresAt, args, address } = item

  return (
    <div className={classNames(txDetailsCss.container, txDetailsCss.containerContrast)}>
      <div className={txDetailsCss.details}>
        <div className={txDetailsCss.txData}>
          <RecoveryDescription item={item} />
        </div>

        <div className={txDetailsCss.txSummary}>
          <TxDataRow title="Transaction hash">{generateDataRowValue(transactionHash, 'hash', true)}</TxDataRow>
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
            <ColorCodedTxAccordion>
              <div className="flex flex-col gap-2">
                <TxDataRow title="Module">{generateDataRowValue(address, 'address', true)}</TxDataRow>
                <TxDataRow title="Value">{generateDataRowValue(args.value.toString())}</TxDataRow>
                <TxDataRow title="Operation">
                  {generateDataRowValue(
                    `${Number(args.operation)} (${Operation[Number(args.operation)].toLowerCase()})`,
                  )}
                </TxDataRow>
                <TxDataRow title="Raw data">{generateDataRowValue(args.data, 'rawData')}</TxDataRow>
              </div>
            </ColorCodedTxAccordion>
          </div>
        </div>
      </div>

      <div className={txDetailsCss.txSigners}>
        <RecoverySigners item={item} />
      </div>
    </div>
  )
}
