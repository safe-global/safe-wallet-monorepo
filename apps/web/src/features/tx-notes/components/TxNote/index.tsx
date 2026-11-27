import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { AppRoutes } from '@/config/routes'
import EthHashInfo from '@/components/common/EthHashInfo'
import PrivateNote from '../PrivateNote'
import { HIDDEN_NOTE, usePrivateNote } from '../../public/services/privateNotesPrototype'

/** The transaction's note: the Workspace's private note, or the public note written before private notes */
export default function TxNote({ txDetails }: { txDetails: TransactionDetails | undefined }) {
  const privateNote = usePrivateNote(txDetails?.txId)

  if (privateNote === HIDDEN_NOTE) return <PrivateNote variant="hidden" upgradeHref={AppRoutes.spaces.plans} />

  if (privateNote) {
    return (
      <PrivateNote
        variant="private"
        text={privateNote.text}
        author={privateNote.author}
        createdAt={privateNote.createdAt}
      />
    )
  }

  const note = txDetails?.note
  if (!note) return null

  const creator =
    isMultisigDetailedExecutionInfo(txDetails?.detailedExecutionInfo) && txDetails?.detailedExecutionInfo.proposer

  return (
    <PrivateNote
      variant="public"
      text={note}
      author={
        creator ? (
          <EthHashInfo avatarSize={16} address={creator.value} showName onlyName showCopyButton={false} />
        ) : (
          'transaction creator'
        )
      }
    />
  )
}
