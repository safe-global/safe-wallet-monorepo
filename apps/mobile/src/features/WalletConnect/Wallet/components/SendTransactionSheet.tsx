import React, { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { DappIdentity } from './DappIdentity'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { selectSessionsRecord, type PendingSessionRequest } from '../store/walletKitSlice'

type Props = {
  pending: PendingSessionRequest
  // Asks the host to swap in the permissions panel (opened by the verify badge or domain pill).
  onOpenPermissions?: () => void
}

// Identity-only "Transaction request" gate: no draft is composed until the
// user taps Review (useTxRequestActions). dApp metadata comes from the mirrored session by topic.
export const SendTransactionSheet: React.FC<Props> = ({ pending, onOpenPermissions }) => {
  const meta = useAppSelector((s) => selectSessionsRecord(s)[pending.topic]?.peer.metadata)
  const variant = useMemo(() => verifyStatusToVariant(pending.verifyContext?.verified), [pending.verifyContext])

  return (
    <DappIdentity
      title="Transaction request"
      name={meta?.name}
      url={meta?.url}
      iconUrl={meta?.icons?.[0]}
      variant={variant}
      onPressBadge={onOpenPermissions}
      onPressDomain={onOpenPermissions}
      domainTestID="wc-tx-domain"
    />
  )
}
