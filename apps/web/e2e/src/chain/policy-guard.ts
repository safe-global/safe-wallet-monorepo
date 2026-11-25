import { Contract, getAddress, zeroPadValue } from 'ethers'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import { readChain } from './local-provider'

// keccak256("guard_manager.guard.address") and keccak256("module_manager.module_guard.address") of Safe v1.5.0
const TRANSACTION_GUARD_SLOT = '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'
const MODULE_GUARD_SLOT = '0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947'
const ERC20_TRANSFER_POLICY_ABI = [
  'function getRecipientPermission(address policyGuard, address safe, address token, address recipient) view returns (uint8)',
]

export type GuardSlots = { transactionGuard: string; moduleGuard: string }

/** ERC20TransferPolicy's `Permission` enum */
export const RECIPIENT_PERMISSION = { NONE: 0, ONCE: 1, ALWAYS: 2 } as const

const addressInSlot = (word: string): string => getAddress(`0x${zeroPadValue(word, 32).slice(-40)}`)

/** The guards in the Safe's transaction and module guard slots; the zero address where a slot is empty. */
export function readGuardSlots(env: JourneyEnvironment, safe: string): Promise<GuardSlots> {
  return readChain(env, async (provider) => {
    const [transactionGuard, moduleGuard] = await Promise.all([
      provider.getStorage(safe, TRANSACTION_GUARD_SLOT),
      provider.getStorage(safe, MODULE_GUARD_SLOT),
    ])
    return { transactionGuard: addressInSlot(transactionGuard), moduleGuard: addressInSlot(moduleGuard) }
  })
}

/** What the guard's ERC20TransferPolicy lets the Safe do when it sends `token` to `recipient`. */
export function readRecipientPermission(
  env: JourneyEnvironment,
  {
    policy,
    guard,
    safe,
    token,
    recipient,
  }: { policy: string; guard: string; safe: string; token: string; recipient: string },
): Promise<number> {
  return readChain(env, async (provider) => {
    const contract = new Contract(policy, ERC20_TRANSFER_POLICY_ABI, provider)
    const permission: bigint = await contract.getFunction('getRecipientPermission')(guard, safe, token, recipient)
    return Number(permission)
  })
}
