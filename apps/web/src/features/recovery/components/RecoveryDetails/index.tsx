import { Operation } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'

import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import ColorCodedTxAccordion from '@/components/tx/ColorCodedTxAccordion'
import RecoverySigners from '../RecoverySigners'
import RecoveryDescription from '../RecoveryDescription'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { RecoveryDetailsView } from '@views/features/recovery/components/RecoveryDetails/RecoveryDetailsView'

export default function RecoveryDetails({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { transactionHash, timestamp, validFrom, expiresAt, args, address } = item

  return (
    <RecoveryDetailsView
      timestamp={timestamp}
      validFrom={validFrom}
      expiresAt={expiresAt}
      description={<RecoveryDescription item={item} />}
      signers={<RecoverySigners item={item} />}
      transactionHashValue={generateDataRowValue(transactionHash, 'hash', true)}
      moduleValue={generateDataRowValue(address, 'address', true)}
      valueValue={generateDataRowValue(args.value.toString())}
      operationValue={generateDataRowValue(
        `${Number(args.operation)} (${Operation[Number(args.operation)].toLowerCase()})`,
      )}
      rawDataValue={generateDataRowValue(args.data, 'rawData')}
      renderAccordion={(children) => <ColorCodedTxAccordion>{children}</ColorCodedTxAccordion>}
    />
  )
}
