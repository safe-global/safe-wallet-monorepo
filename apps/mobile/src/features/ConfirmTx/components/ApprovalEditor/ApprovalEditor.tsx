import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import type { ApprovalInfo } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { useAppSelector } from '@/src/store/hooks'
import { selectDraftByHash } from '@/src/store/draftTxSlice'
import { useApprovalInfos } from './hooks/useApprovalInfos'
import { ApprovalsList } from './ApprovalsList'

interface ApprovalEditorProps {
  txId: string
}

/** Approvals card for draft dApp transactions; hidden without a draft or non-zero approvals, like web */
export const ApprovalEditor = ({ txId }: ApprovalEditorProps) => {
  const router = useRouter()
  const draft = useAppSelector((state) => selectDraftByHash(state, txId))
  const approvals = useApprovalInfos(draft)
  const nonZeroApprovals = useMemo(() => approvals?.filter((approval) => approval.amount !== 0n), [approvals])

  const onEdit = useCallback(
    (approval: ApprovalInfo) => {
      router.push({
        pathname: '/edit-approval-sheet',
        params: { txId, transactionIndex: String(approval.transactionIndex) },
      })
    },
    [router, txId],
  )

  if (!draft || !nonZeroApprovals?.length) {
    return null
  }

  return <ApprovalsList approvals={nonZeroApprovals} onEdit={onEdit} />
}
