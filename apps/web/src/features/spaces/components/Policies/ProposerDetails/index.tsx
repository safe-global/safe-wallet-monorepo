import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafeOverviews } from '../../../hooks/useSpaceSafeOverviews'
import ProposerDrawer, { ProposerStatus } from '../ProposerDrawer'
import type { Proposer, ProposerPolicy } from '../types'

export type ProposerDetailsProps = {
  policy: ProposerPolicy
  proposer: Proposer
  onClose: () => void
}

/** The grant carries no timestamp, so the drawer cannot say when it was made. */
const NO_TIMESTAMP = 'Not available'

/** A proposer is a delegate registration, so nothing on chain enforces it. */
const ENFORCED_BY = 'Off-chain, no module'

const ProposerDetails = ({ policy, proposer, onClose }: ProposerDetailsProps) => {
  const { chainId, address: safeAddress } = policy.safe
  const grantor = proposer.delegatedBy[0]?.delegator
  const proposerContact = useAddressBookItem(proposer.proposer, chainId)
  const safeContact = useAddressBookItem(safeAddress, chainId)
  const grantorContact = useAddressBookItem(grantor ?? '', chainId)
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { ownedByChain } = useSpaceSafeOverviews([{ chainId, address: safeAddress }])

  const isSigner = (ownedByChain[chainId] ?? []).some((owned) => sameAddress(owned, safeAddress))
  const safeName = getSafeDisplayInfo(safeContact?.name ?? '', safeAddress).displayName
  const proposerName = proposerContact?.name ?? proposer.delegatedBy.find((grant) => grant.label)?.label

  const overview = {
    proposer: { address: proposer.proposer, name: proposerName },
    appliesTo: { address: safeAddress, name: safeContact?.name },
    initiatedBy: { address: grantor ?? '', name: grantorContact?.name },
    lastUpdated: NO_TIMESTAMP,
    enforcedBy: ENFORCED_BY,
  }

  if (!wallet) {
    return (
      <ProposerDrawer
        open
        onClose={onClose}
        status={ProposerStatus.ACTIVE}
        overview={overview}
        actionLabel="Connect wallet"
        actionHint={`Connect a signer wallet of ${safeName} to edit.`}
        onAction={connectWallet}
      />
    )
  }

  return (
    <ProposerDrawer
      open
      onClose={onClose}
      status={ProposerStatus.ACTIVE}
      overview={overview}
      actionLabel="Remove proposer"
      actionVariant="secondary"
      actionDisabled={!isSigner}
      actionHint={isSigner ? undefined : `Only signers of ${safeName} can delete or edit this Proposer role.`}
      onAction={() => {
        // TODO(WA-3142): open the revoke flow.
      }}
    />
  )
}

export default ProposerDetails
