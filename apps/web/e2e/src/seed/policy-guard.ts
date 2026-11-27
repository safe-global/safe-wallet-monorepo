/**
 * The policy engine of the recipient allowlist on the fork, and the indexer state the gateway reads about it.
 *
 * The guard and its policies were deployed on Sepolia after the fork block, so `installPolicyEngine` writes their
 * runtime code, fetched once from Sepolia, at their deployment addresses. The indexer mock has no chain access, so
 * journeys register the bindings and configuration roots that the real indexer would read from the guard's events.
 */
import { readFileSync } from 'node:fs'
import { getAddress } from 'ethers'
import { REJECT_SELECTOR } from '@/features/policy-guard/public/services/rejectAccess'
import { registerGuardPolicies } from '../../environment/scenarios/policy-indexer.mjs'
import { executeTransaction, openSafe } from '../../environment/scenarios/safe.mjs'
import { readChain } from '../chain/local-provider'
import { CHAIN_IDS } from '../data/constants'
import type { Journey, JourneyEnvironment, OwnerName } from '../fixtures/journey.fixture'
import {
  configurationRootOf as rootOf,
  ERC20_TRANSFER_SELECTOR,
  firstSetupCalls,
  type PolicyEngine,
  type TokenAllowlist,
} from './policy-guard-configuration'
import type { SeededSafe } from './safe'

export type { TokenAllowlist }

type ContractName =
  'SafePolicyGuard' | 'ERC20TransferPolicy' | 'ERC20ApprovePolicy' | 'AllowPolicy' | 'DenyPolicy' | 'MultiSendPolicy'

type PolicyEngineFixture = { contracts: Array<{ name: ContractName; address: string; code: string }> }

const fixture: PolicyEngineFixture = JSON.parse(
  readFileSync(new URL('./policy-engine-contracts.json', import.meta.url), 'utf8'),
)

const addressOf = (name: ContractName): string => {
  const contract = fixture.contracts.find((entry) => entry.name === name)
  if (!contract) throw new Error(`policy-engine-contracts.json has no ${name}`)
  return getAddress(contract.address)
}

/** The 3-minute delay guard that the wallet sets up on Sepolia */
export const POLICY_GUARD = addressOf('SafePolicyGuard')
export const ERC20_TRANSFER_POLICY = addressOf('ERC20TransferPolicy')
const ALLOW_POLICY = addressOf('AllowPolicy')
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

/** Writes the guard and policy code on the fork where it is missing; parallel workers write the same code. */
export async function installPolicyEngine(env: JourneyEnvironment): Promise<void> {
  await readChain(env, async (provider) => {
    for (const { address, code } of fixture.contracts) {
      if ((await provider.getCode(address)) === code) continue
      await provider.send('anvil_setCode', [address, code])
    }
  })
}

/**
 * Sets up the allowlist as the wallet's first setup does, in one Safe transaction: `configureImmediately` with the
 * token rule and the reject rule, then both guard slots. `cosigners` sign first, as a Safe with a threshold above 1
 * needs; the Safe's context signer signs last and executes. Registers the bindings in the indexer.
 */
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
