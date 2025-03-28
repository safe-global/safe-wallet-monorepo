import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import Approvals from '@/components/tx/ApprovalEditor/Approvals'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { decodeSafeTxToBaseTransactions } from '@/utils/transactions'
import { Alert, Box, Skeleton, Typography } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
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
      <Typography
        sx={{
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      <Typography variant="body2">{subtitle}</Typography>
    </div>
  )
}

export const ApprovalEditor = ({
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
    <Box
      className={css.container}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        mb: 1,
      }}
    >
      <Title isErc721={isErc721Approval} />
      {error ? (
        <Alert severity="error">Error while decoding approval transactions.</Alert>
      ) : loading || !readableApprovals ? (
        <Skeleton variant="rounded" height={100} data-testid="approval-editor-loading" />
      ) : isReadOnly ? (
        <Approvals approvalInfos={readableApprovals} />
      ) : (
        <ApprovalEditorForm approvalInfos={readableApprovals} updateApprovals={updateApprovals} />
      )}
    </Box>
  )
}

export default ApprovalEditor
