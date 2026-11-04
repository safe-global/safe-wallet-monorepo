import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { ForeignGuard, GuardSlot, PolicyGuardState } from '../types'

export const resolvePolicyGuardState = ({
  txGuard,
  moduleGuard,
  policyGuardAddress,
}: {
  txGuard: string
  moduleGuard: string
  policyGuardAddress: string
}): PolicyGuardState => {
  const slots: Array<{ slot: GuardSlot; address: string }> = [
    { slot: 'transaction', address: txGuard },
    { slot: 'module', address: moduleGuard },
  ]
  const isEmpty = (address: string) => sameAddress(address, ZERO_ADDRESS)
  const isOurs = (address: string) => sameAddress(address, policyGuardAddress)

  const foreignGuards: ForeignGuard[] = slots.filter(({ address }) => !isEmpty(address) && !isOurs(address))
  if (foreignGuards.length) return { status: 'unknown', foreignGuards }

  const missing = slots.filter(({ address }) => isEmpty(address))
  if (missing.length === 2) return { status: 'none' }
  if (missing.length === 1) return { status: 'partial', missingSlot: missing[0].slot }
  return { status: 'known' }
}
