import { ProposerStatus, type ProposerDrawerContentProps } from '../../ProposerDrawer'
import type { ProposerPolicy } from '../../types'
import { useActiveProposer } from './useActiveProposer'
import type { ProposerDetailsArgs } from './types'

/** Nothing in the payload marks a proposer as pending yet, so only `enabled` decides. */
export const getProposerStatus = (policy: ProposerPolicy): ProposerStatus =>
  policy.enabled ? ProposerStatus.ACTIVE : ProposerStatus.NOT_ACTIVATED

/** Hooks cannot be called conditionally, so every variant is built and the policy's status picks one. */
export const useProposerDetails = (args: ProposerDetailsArgs): ProposerDrawerContentProps => {
  const active = useActiveProposer(args)

  const byStatus: Record<ProposerStatus, ProposerDrawerContentProps> = {
    [ProposerStatus.ACTIVE]: active,
    // TODO: build the PENDING and NOT_ACTIVATED variants once CGW sends the grant's signatures, threshold and expiry.
    [ProposerStatus.PENDING]: active,
    [ProposerStatus.NOT_ACTIVATED]: active,
  }

  return byStatus[getProposerStatus(args.policy)]
}
