// The indexer mock has no chain access, so journeys register the rows the real indexer would read from guard events
import { getAddress } from 'ethers'
import {
  getPolicyEngineAddress,
  getPolicyGuardDelay,
} from '@/features/policy-guard/public/services/policyEngineDeployments'
import type { PolicyEngineContract } from '@/features/policy-guard/public/services/policyEngineDeployments'
import { REJECT_SELECTOR } from '@/features/policy-guard/public/services/rejectAccess'
import { registerGuardPolicies } from '../../environment/scenarios/policy-indexer.mjs'
import { executeTransaction, openSafe } from '../../environment/scenarios/safe.mjs'
import { readChain } from '../chain/local-provider'
import { CHAIN_IDS } from '../data/constants'
import type { Journey, OwnerName } from '../fixtures/journey.fixture'
import {
  configurationRootOf as rootOf,
  ERC20_TRANSFER_SELECTOR,
  firstSetupCalls,
  type PolicyEngine,
  type TokenAllowlist,
} from './policy-guard-configuration'
import type { SeededSafe } from './safe'

export type { TokenAllowlist }

const deployedOnSepolia = (contract: PolicyEngineContract): string => {
  const address = getPolicyEngineAddress(CHAIN_IDS.sepolia, contract)
  if (!address) throw new Error(`No ${contract} deployment on Sepolia`)
  return getAddress(address)
}

/** The 3-minute delay guard, which the wallet sets up when NEXT_PUBLIC_POLICY_GUARD_DELAY_SECONDS is 180 */
export const POLICY_GUARD = getAddress('0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f')
if (getPolicyGuardDelay(CHAIN_IDS.sepolia, POLICY_GUARD) !== 180) {
  throw new Error(`The wallet lists no 180 s policy guard at ${POLICY_GUARD} on Sepolia`)
}
export const ERC20_TRANSFER_POLICY = deployedOnSepolia('ERC20TransferPolicy')
const ALLOW_POLICY = deployedOnSepolia('AllowPolicy')
/** The guard's `EXPIRY`: how long a requested root stays applicable after its delay */
export const ROOT_EXPIRY_SECONDS = 604_800

const ENGINE: PolicyEngine = {
  guard: POLICY_GUARD,
  erc20TransferPolicy: ERC20_TRANSFER_POLICY,
  allowPolicy: ALLOW_POLICY,
}

/** The root that `requestConfiguration` takes for the allowlist on `safe`: the hash `applyConfiguration` checks. */
export function configurationRootOf(allowlist: TokenAllowlist, safe: string): string {
  return rootOf(allowlist, safe, ENGINE)
}

/** Cosigners sign first, as a threshold above 1 needs; the Safe's context signer signs last and executes */
export async function seedAllowlist(
  journey: Journey,
  safe: SeededSafe,
  allowlist: TokenAllowlist,
  { cosigners = [] }: { cosigners?: OwnerName[] } = {},
): Promise<void> {
  const { context } = safe
  let setup = await context.safe.createTransaction({
    transactions: firstSetupCalls(allowlist, safe.address, ENGINE),
    onlyCalls: true,
  })
  for (const cosigner of cosigners) {
    const { safe: signer } = await openSafe(journey.env, journey.owners[cosigner], safe.address)
    setup = await signer.signTransaction(setup)
  }
  await readChain(context.env, (provider) => executeTransaction({ ...context, provider }, setup))
  await registerAllowlist(safe, { allowlist })
}

type RootRegistration = { root: string; readyAt: number; status: 'PENDING' | 'APPLIED' | 'INVALIDATED' }

/**
 * Makes the indexer report `allowlist` as the Safe's bound ERC-20 allowlist, next to the reject rule of the first
 * setup, and `roots` as its configuration roots, in place of what it reported before.
 */
export async function registerAllowlist(
  safe: SeededSafe,
  { allowlist, roots = [] }: { allowlist: TokenAllowlist; roots?: RootRegistration[] },
): Promise<void> {
  const chainId = Number(CHAIN_IDS.sepolia)
  const safeAddress = getAddress(safe.address)
  await registerGuardPolicies(
    safe.context.env,
    { chainId, safe: safeAddress },
    {
      GuardPolicyBinding: [
        {
          chainId,
          safe: safeAddress,
          guard: POLICY_GUARD,
          target: getAddress(allowlist.token),
          selector: ERC20_TRANSFER_SELECTOR,
          operation: 'CALL',
          kind: 'ERC20_TRANSFER',
          policy: ERC20_TRANSFER_POLICY,
          state: {
            recipients: allowlist.recipients.map((recipient) => ({
              account: getAddress(recipient),
              permission: 'ALWAYS',
            })),
          },
        },
        {
          chainId,
          safe: safeAddress,
          guard: POLICY_GUARD,
          target: safeAddress,
          selector: REJECT_SELECTOR,
          operation: 'CALL',
          kind: 'ALLOW',
          policy: ALLOW_POLICY,
          state: null,
        },
      ],
      ConfigurationRoot: roots.map(({ root, readyAt, status }) => ({
        chainId,
        safe: safeAddress,
        guard: POLICY_GUARD,
        root,
        readyAt: String(readyAt),
        expiresAt: String(readyAt + ROOT_EXPIRY_SECONDS),
        status,
      })),
    },
  )
}
