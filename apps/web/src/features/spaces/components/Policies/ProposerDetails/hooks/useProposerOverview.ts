import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import type { ProposerOverviewProps } from '../../ProposerDrawer/components/ProposerOverview'
import type { ProposerRef } from './types'

/** The grant carries no timestamp, so the drawer cannot say when it was made. */
const NO_TIMESTAMP = 'Not available'

/** A proposer is a delegate registration that Safe{Wallet} enforces off-chain. */
const ENFORCED_BY = 'Safe{Wallet}'

export const useProposerOverview = ({ policy, proposer }: ProposerRef): ProposerOverviewProps => {
  const { chainId, address: safeAddress } = policy.safe
  const grantor = proposer.delegatedBy[0]?.delegator
  const proposerContact = useAddressBookItem(proposer.proposer, chainId)
  const safeContact = useAddressBookItem(safeAddress, chainId)
  const grantorContact = useAddressBookItem(grantor ?? '', chainId)

  return {
    proposer: {
      address: proposer.proposer,
      name: proposerContact?.name ?? proposer.delegatedBy.find((grant) => grant.label)?.label,
    },
    appliesTo: { address: safeAddress, name: safeContact?.name },
    initiatedBy: { address: grantor ?? '', name: grantorContact?.name },
    lastUpdated: NO_TIMESTAMP,
    enforcedBy: ENFORCED_BY,
  }
}
