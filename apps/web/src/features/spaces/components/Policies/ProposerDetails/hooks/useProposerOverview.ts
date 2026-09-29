import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
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
  const shortName = useChain(chainId)?.shortName

  return {
    proposer: {
      address: proposer.proposer,
      name: proposerContact?.name ?? proposer.delegatedBy.find((grant) => grant.label)?.label,
    },
    appliesTo: {
      address: safeAddress,
      name: safeContact?.name,
      href: buildSafeHref(AppRoutes.settings.setup, shortName, safeAddress),
    },
    initiatedBy: { address: grantor ?? '', name: grantorContact?.name },
    lastUpdated: NO_TIMESTAMP,
    enforcedBy: ENFORCED_BY,
  }
}
