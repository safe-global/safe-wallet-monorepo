import React, { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectDraftByHash } from '@/src/store/draftTxSlice'
import { useApprovalInfos } from './hooks/useApprovalInfos'
import { ApprovalsList } from './ApprovalsList'

interface ApprovalEditorProps {
  txId: string
}

/**
 * Shows the approvals a draft dApp transaction grants and lets the user edit
 * the amounts before signing. Renders nothing for proposed transactions (no
 * draft) or transactions without approvals; zero approvals (revokes) are
 * hidden like on web.
 */
export const ApprovalEditor = ({ txId }: ApprovalEditorProps) => {
  const draft = useAppSelector((state) => selectDraftByHash(state, txId))
  const approvals = useApprovalInfos(draft)
  const nonZeroApprovals = useMemo(() => approvals?.filter((approval) => approval.amount !== 0n), [approvals])

  if (!draft || !nonZeroApprovals?.length) {
    return null
  }

  return <ApprovalsList approvals={nonZeroApprovals} />
}
