import type { ProposerDrawerContentProps } from '../../ProposerDrawer'
import { useActiveProposer } from './useActiveProposer'
import type { ProposerDetailsArgs } from './types'

// TODO: return the NOT_ACTIVATED variant once CGW sends the grant's signatures, threshold and expiry.
export const useNotActiveProposer = (args: ProposerDetailsArgs): ProposerDrawerContentProps => useActiveProposer(args)
