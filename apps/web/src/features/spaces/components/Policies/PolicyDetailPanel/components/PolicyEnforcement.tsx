import { ShieldCheck } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import type { Policy, PolicyType } from '../../types'

const MODULE_LABELS: Record<PolicyType, string> = {
  'spending-limit': 'Safe allowance module',
  recovery: 'Safe delay module',
  proposer: 'Safe module',
}

/**
 * What enforces the policy, and for a proposer grant, the fact that nothing does.
 *
 * A proposer grant is held off chain, so there is no contract to link to. A module link there would
 * tell the user the grant is enforced on chain when it is not. The branch reads the enforcement
 * field from CGW rather than the policy type, so a future off-chain policy needs no change here.
 */
const PolicyEnforcement = ({ policy }: { policy: Policy }) => {
  const chain = useChain(policy.safe.chainId)

  if (policy.enforcement.via === 'offchain') {
    return (
      <Typography variant="paragraph-small" className="text-muted-foreground">
        No module — access is granted off-chain and is not enforced on-chain
      </Typography>
    )
  }

  const label = MODULE_LABELS[policy.type]
  const link = chain ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress) : undefined

  return (
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {link ? (
        <ExternalLink href={link.href}>{label}</ExternalLink>
      ) : (
        <Typography variant="paragraph-small">{label}</Typography>
      )}
    </span>
  )
}

export default PolicyEnforcement
