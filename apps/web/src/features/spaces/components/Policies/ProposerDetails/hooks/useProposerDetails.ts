import { ProposerStatus, type ProposerDrawerContentProps } from '../../ProposerDrawer'
import type { ProposerPolicy } from '../../types'
import { useActiveProposer } from './useActiveProposer'
import { useNotActiveProposer } from './useNotActiveProposer'
import { usePendingProposer } from './usePendingProposer'
import type { ProposerDetailsArgs } from './types'

/** Nothing in the payload marks a proposer as pending yet, so only `enabled` decides. */
export const getProposerStatus = (policy: ProposerPolicy): ProposerStatus =>
  policy.enabled ? ProposerStatus.ACTIVE : ProposerStatus.NOT_ACTIVATED

/** Hooks cannot be called conditionally, so every variant is built and the policy's status picks one. */
export const useProposerDetails = (args: ProposerDetailsArgs): ProposerDrawerContentProps => {
  const active = useActiveProposer(args)
  const pending = usePendingProposer(args)
  const notActive = useNotActiveProposer(args)

  const byStatus: Record<ProposerStatus, ProposerDrawerContentProps> = {
    [ProposerStatus.ACTIVE]: active,
    [ProposerStatus.PENDING]: pending,
    [ProposerStatus.NOT_ACTIVATED]: notActive,
  }

  return byStatus[getProposerStatus(args.policy)]
}
