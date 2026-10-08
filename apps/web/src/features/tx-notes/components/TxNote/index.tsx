import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { TxNoteView } from '@views/features/tx-notes/components/TxNote/TxNoteView'

export default function TxNote({ txDetails }: { txDetails: TransactionDetails | undefined }) {
  const note = txDetails?.note
  if (!note) return null

  const creator =
    isMultisigDetailedExecutionInfo(txDetails?.detailedExecutionInfo) && txDetails?.detailedExecutionInfo.proposer

  return (
    <TxNoteView
      note={note}
      creator={creator ? <EthHashInfo avatarSize={20} address={creator.value} showName onlyName /> : null}
    />
  )
}
