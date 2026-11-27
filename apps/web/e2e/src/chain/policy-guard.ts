import { AbiCoder, Contract, getAddress, keccak256, toBeHex, zeroPadValue } from 'ethers'
import { GUARD_STORAGE_SLOT, MODULE_GUARD_STORAGE_SLOT } from '@/features/policy-guard/public/constants'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import { readChain } from './local-provider'

// SafePolicyGuard keeps `mapping(address safe => mapping(bytes32 root => uint256 readyAt))` at this storage slot
const ROOT_CONFIGURED_SLOT = 3
const GUARD_ABI = ['function rootConfigured(address safe, bytes32 root) view returns (uint256)']
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
      provider.getStorage(safe, GUARD_STORAGE_SLOT),
      provider.getStorage(safe, MODULE_GUARD_STORAGE_SLOT),
    ])
    return { transactionGuard: addressInSlot(transactionGuard), moduleGuard: addressInSlot(moduleGuard) }
  })
}

/**
 * When the Safe's request for `root` becomes applicable, in unix seconds: `block.timestamp + DELAY` of the request.
 * Zero when the root was never requested, or once it has been applied or invalidated.
 */
export function readConfigurationRequest(
  env: JourneyEnvironment,
  { guard, safe, root }: { guard: string; safe: string; root: string },
): Promise<number> {
  return readChain(env, async (provider) => {
    const readyAt: bigint = await new Contract(guard, GUARD_ABI, provider).getFunction('rootConfigured')(safe, root)
    return Number(readyAt)
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

const rootConfiguredSlot = (safe: string, root: string): string => {
  const coder = AbiCoder.defaultAbiCoder()
  const safeMapping = keccak256(coder.encode(['address', 'uint256'], [safe, ROOT_CONFIGURED_SLOT]))
  return keccak256(coder.encode(['bytes32', 'bytes32'], [root, safeMapping]))
}

/**
 * Makes the Safe's pending request for `root` applicable now, by moving its `readyAt` back to the latest block's time
 * instead of moving the fork's clock, which every worker of the shard shares. Returns the new `readyAt`.
 */
export function makeConfigurationApplicable(
  env: JourneyEnvironment,
  { guard, safe, root }: { guard: string; safe: string; root: string },
): Promise<number> {
  return readChain(env, async (provider) => {
    const slot = rootConfiguredSlot(safe, root)
    const readyAt: bigint = await new Contract(guard, GUARD_ABI, provider).getFunction('rootConfigured')(safe, root)
    if (readyAt === 0n || BigInt(await provider.getStorage(guard, slot)) !== readyAt) {
      throw new Error(`The guard holds no request for ${root} at the expected storage slot`)
    }
    const latest = await provider.getBlock('latest')
    if (!latest) throw new Error('The fork has no latest block')
    if (BigInt(latest.timestamp) < readyAt) {
      await provider.send('anvil_setStorageAt', [guard, slot, toBeHex(latest.timestamp, 32)])
    }
    return Math.min(latest.timestamp, Number(readyAt))
  })
}
