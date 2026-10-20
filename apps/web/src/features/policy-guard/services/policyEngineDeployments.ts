import semverSatisfies from 'semver/functions/satisfies'

export type PolicyEngineContract = 'SafePolicyGuard' | 'ERC20ApprovePolicy' | 'ERC20TransferPolicy'

type Deployment = { networkAddresses: Record<string, string> }

// The guard needs the module guard slot, which Safe added in v1.5.0, so every policy shares this floor
const MIN_POLICY_GUARD_SAFE_VERSION = '1.5.0'

// One guard per root-activation delay, all with a 604800s expiry; swap the uncommented line to change the delay
// const SAFE_POLICY_GUARD = '0x55c241591E12CE3c58491D02b737F12D3199ae95' // 0s delay
const SAFE_POLICY_GUARD = '0xC83bC185770ac0Da8A970f35695064eEe62e236c' // 60s delay
// const SAFE_POLICY_GUARD = '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57' // 600s delay
// const SAFE_POLICY_GUARD = '0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20' // 3600s delay
// const SAFE_POLICY_GUARD = '0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED' // 86400s delay

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
