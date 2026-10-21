import { Contract, type ContractRunner } from 'ethers'
import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The head of the module lists of the Safe and of the Delay modifier */
const SENTINEL_ADDRESS = '0x0000000000000000000000000000000000000001'
const PAGE_SIZE = 10
const SAFE_ABI = [
  'function getOwners() view returns (address[])',
  'function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)',
]
const DELAY_MODIFIER_ABI = [
  'function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)',
  'function txCooldown() view returns (uint256)',
  'function txNonce() view returns (uint256)',
  'function queueNonce() view returns (uint256)',
  'function txHash(uint256 nonce) view returns (bytes32)',
  'function txCreatedAt(uint256 nonce) view returns (uint256)',
  'function execTransactionFromModule(address to, uint256 value, bytes data, uint8 operation) returns (bool)',
]

/** The Zodiac Delay modifier at `address`; the Zodiac package's ESM build does not load in Playwright. */
export function delayModifierAt(address: string, runner: ContractRunner): Contract {
  return new Contract(address, DELAY_MODIFIER_ABI, runner)
}

export type SafeSetup = { owners: string[]; modules: string[] }

export type DelayModifierState = {
  recoverers: string[]
  cooldownSeconds: number
  txNonce: number
  queueNonce: number
  /** The hash of the proposal at `txNonce`, the one that runs next; zero when there is none */
  nextProposalHash: string
}

/** The owners and enabled modules of the Safe at `safeAddress`. */
export function readSafeSetup(env: JourneyEnvironment, safeAddress: string): Promise<SafeSetup> {
  return readChain(env, async (provider) => {
    const safe = new Contract(safeAddress, SAFE_ABI, provider)
    const [owners, [modules]] = await Promise.all([
      safe.getOwners(),
      safe.getModulesPaginated(SENTINEL_ADDRESS, PAGE_SIZE),
    ])
    return { owners: [...owners], modules: [...modules] }
  })
}

/** The recoverers, cooldown and queue of the Delay modifier at `address`. */
export function readDelayModifier(env: JourneyEnvironment, address: string): Promise<DelayModifierState> {
  return readChain(env, async (provider) => {
    const delay = delayModifierAt(address, provider)
    const [[recoverers], cooldown, txNonce, queueNonce] = await Promise.all([
      delay.getModulesPaginated(SENTINEL_ADDRESS, PAGE_SIZE),
      delay.txCooldown(),
      delay.txNonce(),
      delay.queueNonce(),
    ])
    return {
      recoverers: [...recoverers],
      cooldownSeconds: Number(cooldown),
      txNonce: Number(txNonce),
      queueNonce: Number(queueNonce),
      nextProposalHash: await delay.txHash(txNonce),
    }
  })
}
