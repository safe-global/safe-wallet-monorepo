import semverSatisfies from 'semver/functions/satisfies'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  MIN_POLICY_GUARD_SAFE_VERSION,
  POLICY_GUARD_DELAY_SECONDS,
} from '@safe-global/utils/features/policy-guard/constants'

export type PolicyEngineContract =
  | 'SafePolicyGuard'
  | 'ERC20ApprovePolicy'
  | 'ERC20TransferPolicy'
  | 'NativeTransferPolicy'
  | 'AllowPolicy'
  | 'DenyPolicy'
  | 'MultiSendPolicy'

type Deployment = { networkAddresses: Record<string, string> }

const INDEXED_CHAIN_IDS = ['1', '137', '11155111']

const onChains = (chainIds: string[], address: string): Deployment => ({
  networkAddresses: Object.fromEntries(chainIds.map((chainId) => [chainId, address])),
})

const onIndexedChains = (address: string): Deployment => onChains(INDEXED_CHAIN_IDS, address)

// Source: https://github.com/safe-global/policy-indexer (config.yaml and src/policies/registry.ts)
// One guard per root-activation delay, all with a 604800s expiry
const POLICY_GUARD_BY_DELAY: Record<string, Deployment> = {
  '0s': onIndexedChains('0x55c241591E12CE3c58491D02b737F12D3199ae95'),
  '60s': onIndexedChains('0xC83bC185770ac0Da8A970f35695064eEe62e236c'),
  '180s': onChains(['137', '11155111'], '0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f'),
  '600s': onIndexedChains('0x46d22E0B3DC367b48bc2d64B789ae154b3177a57'),
  '3600s': onIndexedChains('0xd2fB492adADBa5BcFb7FeBE25746fd5FdE090b20'),
  '86400s': onIndexedChains('0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED'),
}

// A delay no deployed guard has leaves the allowlist unavailable rather than installing another delay
const NO_DEPLOYMENT: Deployment = { networkAddresses: {} }

// The policy indexer's addresses: configurations against any other deployment are invisible to CGW
const DEPLOYMENTS: Record<PolicyEngineContract, Deployment> = {
  SafePolicyGuard: POLICY_GUARD_BY_DELAY[`${POLICY_GUARD_DELAY_SECONDS}s`] ?? NO_DEPLOYMENT,
  ERC20ApprovePolicy: onIndexedChains('0xfF86DD4caf79672E55e0C3e3A5410746600d60F4'),
  ERC20TransferPolicy: onIndexedChains('0x25DDa3b8974a10E93ca188F9C149A42F938Bd187'),
  NativeTransferPolicy: onIndexedChains('0x2868C263EBF3672211E4C32e0B21689FF0584ca3'),
  AllowPolicy: onIndexedChains('0x92e94Af03982C2486dffa8DcBc5d069D33996eF2'),
  DenyPolicy: onIndexedChains('0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436'),
  MultiSendPolicy: onIndexedChains('0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c'),
}

export const getPolicyEngineAddress = (chainId: string, contract: PolicyEngineContract): string | undefined =>
  DEPLOYMENTS[contract].networkAddresses[chainId]

export const getPolicyGuardAddress = (chainId: string): string | undefined =>
  getPolicyEngineAddress(chainId, 'SafePolicyGuard')

export const isPolicyGuard = (address?: string | null): boolean =>
  Object.values(POLICY_GUARD_BY_DELAY).some(({ networkAddresses }) =>
    Object.values(networkAddresses).some((guard) => sameAddress(guard, address ?? undefined)),
  )

export const isSafeVersionSupported = (version?: string | null): boolean =>
  !!version && semverSatisfies(version, `>=${MIN_POLICY_GUARD_SAFE_VERSION}`)
