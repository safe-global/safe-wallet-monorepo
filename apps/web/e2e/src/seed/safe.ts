import { Interface, parseEther } from 'ethers'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { DELEGATE_CALL } from '../../environment/scenarios/chain.mjs'
import { waitForQueued, waitUntil } from '../../environment/scenarios/indexing.mjs'
import {
  createSafeAddress,
  executeTransaction,
  onChain,
  openSafe,
  proposeTransaction,
} from '../../environment/scenarios/safe.mjs'
import { readChain } from '../chain/local-provider'
import type { OwnedSafes } from '@safe-global/store/gateway/types'
import { CHAIN_IDS, NETWORK_PREFIXES } from '../data/constants'
import type { Journey, OwnerName } from '../fixtures/journey.fixture'

export type SeededSafe = {
  address: string
  /** The `sep:0x…` form that wallet URLs take, with the prefix of the Safe's network */
  prefixedAddress: string
  /** Signs and proposes as the Safe's first owner that is a journey owner, or as Alice when it has none */
  context: Awaited<ReturnType<typeof openSafe>>
}

export type QueuedTransaction = {
  safeTxHash: string
  /** The CGW transaction ID, as in `/transactions/tx?id=` */
  txId: string
}

export type SafeSetup = {
  /** A journey owner, or a seeded Safe that owns this one */
  owners: Array<OwnerName | SeededSafe>
  threshold: number
  safeVersion?: '1.4.1' | '1.5.0'
  /** Deploys it as the wallet creates a Safe for several networks: on the L1 singleton, with SafeToL2Setup */
  multichain?: boolean
  /** `false` keeps it out of the user's accounts, so Safe Shield asks to confirm the risk of an unknown Safe */
  inAccounts?: boolean
  /** Deploys it on the Ethereum or Polygon fork instead of Sepolia; the spec lists the fork in `chains` */
  network?: Exclude<Network, 'gnosis'>
}

type Network = keyof typeof NETWORK_PREFIXES

/** Deploys a Safe with 1 ETH, waits until CGW serves it, puts it in the user's accounts and names it in the report. */
export async function seedSafe(
  journey: Journey,
  { owners, threshold, safeVersion, multichain, inAccounts = true, network = 'sepolia' }: SafeSetup,
): Promise<SeededSafe> {
  const env = onChain(journey.env, CHAIN_IDS[network])
  const ownerAddresses = owners.map((owner) =>
    typeof owner === 'string' ? journey.owners[owner].address : owner.address,
  )
  const address = await createSafeAddress(env, journey.owners, { threshold, ownerAddresses, safeVersion, multichain })
  const signer = owners.find((owner): owner is OwnerName => typeof owner === 'string') ?? 'alice'
  const safe = {
    address,
    prefixedAddress: `${NETWORK_PREFIXES[network]}:${address}`,
    context: await openSafe(env, journey.owners[signer], address),
  }
  journey.recordSafe(safe)
  if (inAccounts) await journey.addToAccounts(safe)
  return safe
}

/**
 * Proposes `transactions` signed by the Safe's context signer, and waits until it is in the CGW queue. Several
 * transactions make one MultiSend.
 */
export async function seedQueuedTransaction(
  safe: SeededSafe,
  { nonce, transactions }: { nonce: number; transactions: MetaTransactionData[] },
): Promise<QueuedTransaction> {
  const { context } = safe
  const transaction = await context.safe.createTransaction({ transactions, options: { nonce } })
  const { hash } = await proposeTransaction(context, transaction)
  await waitForQueued(context.env, context, [hash])
  return { safeTxHash: hash, txId: `multisig_${safe.address}_${hash}` }
}

/** Proposes an ETH transfer signed by the Safe's context signer, and waits until it is in the CGW queue. */
export function seedQueuedTransfer(
  safe: SeededSafe,
  { nonce, recipient, amount }: { nonce: number; recipient: string; amount: string },
): Promise<QueuedTransaction> {
  return seedQueuedTransaction(safe, {
    nonce,
    transactions: [{ to: recipient, value: parseEther(amount).toString(), data: '0x' }],
  })
}

const erc20 = new Interface(['function transfer(address to, uint256 amount)'])

/** Proposes a transfer of `amount` base units of `token`, signed by the context signer, and waits until it is queued. */
export function seedQueuedTokenTransfer(
  safe: SeededSafe,
  { nonce, token, recipient, amount }: { nonce: number; token: string; recipient: string; amount: bigint },
): Promise<QueuedTransaction> {
  return seedQueuedTransaction(safe, {
    nonce,
    transactions: [{ to: token, value: '0', data: erc20.encodeFunctionData('transfer', [recipient, amount]) }],
  })
}

/** Executes an ETH transfer signed by the Safe's context signer, and waits until the CGW history lists it. */
export async function seedExecutedTransfer(
  safe: SeededSafe,
  { recipient, amount }: { recipient: string; amount: string },
): Promise<void> {
  const { context } = safe
  const transfer = await context.safe.createTransaction({
    transactions: [{ to: recipient, value: parseEther(amount).toString(), data: '0x' }],
  })
  await readChain(context.env, (provider) => executeTransaction({ ...context, provider }, transfer))
}

const safeMigration = new Interface(['function migrateL2WithFallbackHandler()'])

/** Upgrades a Safe L2 to 1.5.0 as the wallet does, with SafeMigration, and waits until CGW reports the new version. */
export async function upgradeToSafe150(safe: SeededSafe): Promise<void> {
  const { context } = safe
  const migration = getSafeMigrationDeployment({ version: '1.5.0' })?.deployments.canonical?.address
  if (!migration) throw new Error('No canonical SafeMigration 1.5.0 deployment')
  const upgrade = await context.safe.createTransaction({
    transactions: [
      {
        to: migration,
        value: '0',
        data: safeMigration.encodeFunctionData('migrateL2WithFallbackHandler'),
        operation: DELEGATE_CALL,
      },
    ],
  })
  await readChain(context.env, (provider) => executeTransaction({ ...context, provider }, upgrade))
  await waitUntil(context.env, context.path, (info: { version?: string }) => info.version?.startsWith('1.5.0'))
}

type NestedSafeSetup = {
  parent: { owners: OwnerName[]; threshold: number }
  /** `'parent'` stands for the parent Safe */
  child: { owners: Array<OwnerName | 'parent'>; threshold: number; safeVersion?: '1.4.1' | '1.5.0' }
}

/**
 * Deploys a parent Safe and a child Safe that the parent owns. Waits until CGW lists the parent among Alice's
 * Safes, which makes an Alice of the parent a nested owner of the child.
 */
export async function seedNestedSafe(
  journey: Journey,
  { parent: parentSetup, child: childSetup }: NestedSafeSetup,
): Promise<{ parent: SeededSafe; child: SeededSafe }> {
  const parent = await seedSafe(journey, parentSetup)
  const child = await seedSafe(journey, {
    ...childSetup,
    owners: childSetup.owners.map((owner) => (owner === 'parent' ? parent : owner)),
  })
  const { env, chainId } = parent.context
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/owners/${journey.owners.alice.address}/safes`,
    (result: OwnedSafes) => result.safes.includes(parent.address),
  )
  return { parent, child }
}
