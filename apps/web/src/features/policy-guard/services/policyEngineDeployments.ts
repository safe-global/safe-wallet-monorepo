import semverSatisfies from 'semver/functions/satisfies'
import {
  MIN_POLICY_GUARD_SAFE_VERSION,
  SAFE_POLICY_GUARD_BY_DELAY,
} from '@safe-global/utils/features/policy-guard/constants'

export type PolicyEngineContract = 'SafePolicyGuard' | 'ERC20ApprovePolicy' | 'ERC20TransferPolicy'

type Deployment = { networkAddresses: Record<string, string> }

const SAFE_POLICY_GUARD = SAFE_POLICY_GUARD_BY_DELAY['60s']

const INDEXED_CHAIN_IDS = ['1', '137', '11155111']

const onIndexedChains = (address: string): Deployment => ({
  networkAddresses: Object.fromEntries(INDEXED_CHAIN_IDS.map((chainId) => [chainId, address])),
})

// The policy indexer's addresses: configurations against any other deployment are invisible to CGW
const DEPLOYMENTS: Record<PolicyEngineContract, Deployment> = {
  SafePolicyGuard: onIndexedChains(SAFE_POLICY_GUARD),
  ERC20ApprovePolicy: onIndexedChains('0xfF86DD4caf79672E55e0C3e3A5410746600d60F4'),
  ERC20TransferPolicy: onIndexedChains('0x25DDa3b8974a10E93ca188F9C149A42F938Bd187'),
}

export const getPolicyEngineAddress = (chainId: string, contract: PolicyEngineContract): string | undefined =>
  DEPLOYMENTS[contract].networkAddresses[chainId]

export const getPolicyGuardAddress = (chainId: string): string | undefined =>
  getPolicyEngineAddress(chainId, 'SafePolicyGuard')

export const isSafeVersionSupported = (version?: string | null): boolean =>
  !!version && semverSatisfies(version, `>=${MIN_POLICY_GUARD_SAFE_VERSION}`)
