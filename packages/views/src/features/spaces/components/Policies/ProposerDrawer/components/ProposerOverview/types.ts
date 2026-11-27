import type { AccountIdentityProps } from '@safe-global/views/features/spaces/components/Policies/components/AccountIdentity/types'

export type ProposerOverviewProps = {
  proposer: AccountIdentityProps
  appliesTo: AccountIdentityProps
  initiatedBy: AccountIdentityProps
  chainId: string
  lastUpdated: string
  enforcedBy: string
}
