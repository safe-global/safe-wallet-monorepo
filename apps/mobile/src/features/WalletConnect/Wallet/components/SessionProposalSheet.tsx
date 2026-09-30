import React, { useMemo } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import { DappIdentity } from './DappIdentity'
import { verifyStatusToVariant } from '../utils/verifyStatus'

type Props = {
  pending: { id: number; proposal: WalletKitTypes.SessionProposal }
  // Asks the host to swap in the permissions panel (rendered by RequestSheetHost so its CTA
  // can be pinned to the sheet's bottom edge as a BottomSheetFooter).
  onOpenPermissions?: () => void
}

// Presentation only — the "Connect" CTA is rendered by RequestSheetHost as a pinned
// BottomSheetFooter (alongside the permissions panel's "Got it"), so both sit flush at the
// bottom edge of the sheet regardless of content height. The verify badge and the domain
// pill both open the permissions panel.
export const SessionProposalSheet: React.FC<Props> = ({ pending, onOpenPermissions }) => {
  const { proposer } = pending.proposal.params
  const verifyContext = pending.proposal.verifyContext
  const variant = useMemo(() => verifyStatusToVariant(verifyContext?.verified), [verifyContext])

  const meta = proposer.metadata

  return (
    <DappIdentity
      title="Connection request"
      name={meta.name}
      url={meta.url}
      iconUrl={meta.icons?.[0]}
      variant={variant}
      onPressBadge={onOpenPermissions}
      onPressDomain={onOpenPermissions}
      domainTestID="wc-proposal-domain"
    />
  )
}
