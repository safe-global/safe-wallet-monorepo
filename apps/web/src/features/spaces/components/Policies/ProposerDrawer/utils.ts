import type { PolicyStatus } from '../types'
import { ProposerStatus } from './variants/types'

/** Every proposer status has a policy status that says the same thing, so both surfaces read alike. */
const POLICY_STATUS: Record<ProposerStatus, PolicyStatus> = {
  [ProposerStatus.ACTIVE]: 'active',
  [ProposerStatus.PENDING]: 'pending',
  [ProposerStatus.NOT_ACTIVATED]: 'not-activated',
}

export const toPolicyStatus = (status: ProposerStatus): PolicyStatus => POLICY_STATUS[status]
