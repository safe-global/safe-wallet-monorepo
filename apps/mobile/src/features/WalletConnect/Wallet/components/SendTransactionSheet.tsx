import React, { useMemo } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { DappIdentity } from './DappIdentity'
import { verifyStatusToVariant } from '../utils/verifyStatus'
import { selectSessionsRecord, type PendingSessionRequest } from '../store/walletKitSlice'

type Props = {
  pending: PendingSessionRequest
}

// Identity-only "Transaction request" gate (Figma `16755-4705`): dApp logo + verify badge,
// name and domain. No decoded transaction and no draft are created while this is open — the
// draft is composed only when the user taps Review (handled by useSendTransaction in the
// host footer). dApp metadata is resolved from the mirrored session by topic.
export const SendTransactionSheet: React.FC<Props> = ({ pending }) => {
  const meta = useAppSelector((s) => selectSessionsRecord(s)[pending.topic]?.peer.metadata)
  const variant = useMemo(() => verifyStatusToVariant(pending.verifyContext?.verified), [pending.verifyContext])

  return (
    <DappIdentity
      title="Transaction request"
      name={meta?.name}
      url={meta?.url}
      iconUrl={meta?.icons?.[0]}
      variant={variant}
      domainTestID="wc-tx-domain"
    />
  )
}
