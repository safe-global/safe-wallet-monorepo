import type { ProposerDrawerContentProps } from '../../ProposerDrawer'
import { useActiveProposer } from './useActiveProposer'
import type { ProposerDetailsArgs } from './types'

// TODO: return the PENDING variant once CGW sends the grant's signatures, threshold and expiry.
// THIS IS TEMPORARY
export const usePendingProposer = (args: ProposerDetailsArgs): ProposerDrawerContentProps => useActiveProposer(args)
