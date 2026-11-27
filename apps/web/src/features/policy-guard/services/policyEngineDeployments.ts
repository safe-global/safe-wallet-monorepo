import semverSatisfies from 'semver/functions/satisfies'
import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'

export type PolicyEngineContract = 'SafePolicyGuard' | 'ERC20ApprovePolicy' | 'ERC20TransferPolicy'

type Deployment = { networkAddresses: Record<string, string> }

// Source: https://github.com/safe-global/policy-indexer/blob/main/config.yaml
// One guard per root-activation delay, all with a 604800s expiry
const POLICY_GUARD_BY_DELAY = {
  '0s': '0x55c241591E12CE3c58491D02b737F12D3199ae95',
  '60s': '0xC83bC185770ac0Da8A970f35695064eEe62e236c',
  '600s': '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57',
  '3600s': '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20',
  '86400s': '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED',
}

const SAFE_POLICY_GUARD = POLICY_GUARD_BY_DELAY['60s']

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
