import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import Approvals from '@/components/tx/ApprovalEditor/Approvals'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { decodeSafeTxToBaseTransactions } from '@/utils/transactions'
import { type SafeTransaction } from '@safe-global/types-kit'
import { TokenType } from '@safe-global/store/gateway/types'
import { useContext } from 'react'
import { ApprovalEditorForm } from './ApprovalEditorForm'
import { useApprovalInfos } from './hooks/useApprovalInfos'
import { updateApprovalTxs } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { ApprovalEditorView } from '@views/components/tx/ApprovalEditor/ApprovalEditorView'

const ApprovalEditor = ({
  safeTransaction,
  safeMessage,
}: {
  safeTransaction?: SafeTransaction
  safeMessage?: TypedData
}) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const [readableApprovals, error, loading] = useApprovalInfos({ safeTransaction, safeMessage })

  const nonZeroApprovals = readableApprovals?.filter((approval) => !(0n === approval.amount))

  if (nonZeroApprovals?.length === 0 || (!safeTransaction && !safeMessage)) {
    return null
  }

  const updateApprovals = (approvals: string[]) => {
    if (!safeTransaction) {
      return
    }
    const extractedTxs = decodeSafeTxToBaseTransactions(safeTransaction)
    const updatedTxs = updateApprovalTxs(approvals, readableApprovals, extractedTxs)

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = updatedTxs.length > 1
      return isMultiSend ? createMultiSendCallOnlyTx(updatedTxs) : createTx(updatedTxs[0])
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }

  const isErc721Approval = !!readableApprovals?.some((approval) => approval.tokenInfo?.type === TokenType.ERC721)

  const isReadOnly =
    (safeTransaction && safeTransaction.signatures.size > 0) || safeMessage !== undefined || isErc721Approval

  return (
    <ApprovalEditorView
      isErc721={isErc721Approval}
      hasError={!!error}
      isLoading={loading || !readableApprovals}
      content={
        readableApprovals &&
        (isReadOnly ? (
          <Approvals approvalInfos={readableApprovals} />
        ) : (
          <ApprovalEditorForm approvalInfos={readableApprovals} updateApprovals={updateApprovals} />
        ))
      }
    />
  )
}

export default ApprovalEditor
