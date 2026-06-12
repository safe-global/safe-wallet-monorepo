import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import Approvals from '@/components/tx/ApprovalEditor/Approvals'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { decodeSafeTxToBaseTransactions } from '@/utils/transactions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { type SafeTransaction } from '@safe-global/types-kit'
import { TokenType } from '@safe-global/store/gateway/types'
import { useContext } from 'react'
import { ApprovalEditorForm } from './ApprovalEditorForm'
import { useApprovalInfos } from './hooks/useApprovalInfos'
import css from './styles.module.css'
import { updateApprovalTxs } from './utils/approvals'

const Title = ({ isErc721 }: { isErc721: boolean }) => {
  const title = 'Allow access to tokens?'
  const subtitle = isErc721
    ? 'This allows the spender to transfer the specified token.'
    : 'This allows the spender to spend the specified amount of your tokens.'

  return (
    <div>
      <Typography className="font-bold">{title}</Typography>
      <Typography variant="paragraph-small">{subtitle}</Typography>
    </div>
  )
}

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
    <div className={`${css.container} mb-2 flex flex-col gap-4`}>
      <Title isErc721={isErc721Approval} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Error while decoding approval transactions.</AlertDescription>
        </Alert>
      ) : loading || !readableApprovals ? (
        <Skeleton className="h-[100px] w-full" data-testid="approval-editor-loading" />
      ) : isReadOnly ? (
        <Approvals approvalInfos={readableApprovals} />
      ) : (
        <ApprovalEditorForm approvalInfos={readableApprovals} updateApprovals={updateApprovals} />
      )}
    </div>
  )
}

export default ApprovalEditor
