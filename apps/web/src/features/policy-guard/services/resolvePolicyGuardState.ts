import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { ForeignGuard, GuardSlot, PolicyGuardState } from '../types'
import { isPolicyGuardOnChain } from './policyEngineDeployments'

export const resolvePolicyGuardState = ({
  txGuard,
  moduleGuard,
  chainId,
}: {
  txGuard: string
  moduleGuard: string
  chainId: string
}): PolicyGuardState => {
  const slots: Array<{ slot: GuardSlot; address: string }> = [
    { slot: 'transaction', address: txGuard },
    { slot: 'module', address: moduleGuard },
  ]
  const isEmpty = (address: string) => sameAddress(address, ZERO_ADDRESS)

  const foreignGuards: ForeignGuard[] = slots.filter(
    ({ address }) => !isEmpty(address) && !isPolicyGuardOnChain(chainId, address),
  )
  if (foreignGuards.length) return { status: 'unknown', foreignGuards }

  const filled = slots.filter(({ address }) => !isEmpty(address))
  if (filled.length === 0) return { status: 'none' }
  if (filled.length === 1) {
    const missingSlot = filled[0].slot === 'transaction' ? 'module' : 'transaction'
    return { status: 'partial', missingSlot, guardAddress: filled[0].address }
  }

  // A request on one guard wouldn't govern the other slot
  if (!sameAddress(txGuard, moduleGuard)) return { status: 'unknown', foreignGuards: [slots[1]] }
  return { status: 'known', guardAddress: moduleGuard }
}
