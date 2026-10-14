export type PolicyEngineContract =
  'SafePolicyGuard' | 'AllowPolicy' | 'DenyPolicy' | 'CoSignerPolicy' | 'ERC20TransferPolicy' | 'NativeTransferPolicy'

type Deployment = { networkAddresses: Record<string, string> }

// Addresses the policy indexer watches (5s-delay guard); others are invisible to CGW.
// Mirrors the safe-modules-deployments shape so the source can be swapped once WA-3042 publishes it.
const DEPLOYMENTS: Record<PolicyEngineContract, Deployment> = {
  SafePolicyGuard: { networkAddresses: { '11155111': '0x5202B1ebE100812437d47eae769e155945fbba6a' } },
  AllowPolicy: { networkAddresses: { '11155111': '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2' } },
  DenyPolicy: { networkAddresses: { '11155111': '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436' } },
  CoSignerPolicy: { networkAddresses: { '11155111': '0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB' } },
  ERC20TransferPolicy: { networkAddresses: { '11155111': '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187' } },
  NativeTransferPolicy: { networkAddresses: { '11155111': '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246' } },
}

export const getPolicyEngineAddress = (chainId: string, contract: PolicyEngineContract): string | undefined =>
  DEPLOYMENTS[contract].networkAddresses[chainId]

export const getPolicyGuardAddress = (chainId: string): string | undefined =>
  getPolicyEngineAddress(chainId, 'SafePolicyGuard')
