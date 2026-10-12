import { Contract, ZeroAddress, getAddress, solidityPacked, toBeHex, toQuantity } from 'ethers'
import { ALLOWANCE_MODULE, allowanceCall, allowanceSetupCalls, registerAllowanceModule } from './allowance.mjs'
import { fundWithToken, multiSend, send } from './chain.mjs'
import { waitUntil } from './indexing.mjs'
import { createSafe } from './safe.mjs'

/** The staging owner wallets that staging Safes and histories name. */
export const stagingOwners = {
  owner1: '0x8eeC30d6FB6eC104B7308a8847db5FF487152a3b',
  owner3: '0x4fe7164d7cA511Ab35520bb14065F1693240dC90',
  owner4: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
  sepoliaOwner2: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
}

// Generated wallets that sign in place of the staging wallets that sign in tests.
const stagingSigners = {
  [stagingOwners.owner4]: 'owner4',
  [stagingOwners.owner3]: 'owner3',
  [stagingOwners.owner1]: 'owner1',
}

const safeAbi = [
  'function nonce() view returns (uint256)',
  'function getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256) ' +
    'view returns (bytes32)',
  'function approveHash(bytes32)',
  'function execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes) returns (bool)',
]
// Safe storage: singleton, modules, owners, ownerCount, threshold, then the nonce.
const SAFE_NONCE_SLOT = toBeHex(5, 32)

export const localAddress = (owners, address) => owners[stagingSigners[getAddress(address)]]?.address ?? address

/** Approved-hash signatures (v = 1) for `signers`, sorted by owner address as the Safe requires. */
export const approvedHashSignatures = (signers) =>
  solidityPacked(
    signers.flatMap(() => ['uint256', 'uint256', 'uint8']),
    [...signers].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1)).flatMap((signer) => [BigInt(signer), 0n, 1]),
  )

/** Executes as the first `threshold` owners with pre-validated signatures, so no owner key is needed. */
export async function execute(provider, safeAddress, signers, { to, value = 0n, data = '0x', operation = 0 }) {
  const safe = new Contract(safeAddress, safeAbi, provider)
  const params = [to, value, data, operation, 0, 0, 0, ZeroAddress, ZeroAddress]
  const hash = await safe.getTransactionHash(...params, await safe.nonce())
  const [executor, ...approvers] = signers
  for (const approver of approvers) {
    await send(provider, approver, { to: safeAddress, data: safe.interface.encodeFunctionData('approveHash', [hash]) })
  }
  const receipt = await send(provider, executor, {
    to: safeAddress,
    data: safe.interface.encodeFunctionData('execTransaction', [...params, approvedHashSignatures(signers)]),
  })
  return { safeTxHash: hash, receipt }
}

// The spent part of an allowance is a real module transfer by the impersonated delegate (empty signature).
async function spendAllowance(provider, safeAddress, { delegate, spent }) {
  await provider.send('anvil_setBalance', [safeAddress, toQuantity(spent)])
  const transfer = [safeAddress, ZeroAddress, delegate, spent, ZeroAddress, 0, delegate, '0x']
  await send(provider, delegate, allowanceCall('executeAllowanceTransfer', transfer))
}

async function addAllowances(env, provider, safeAddress, signers, allowances) {
  await registerAllowanceModule(env)
  // One batched setup transaction, as on staging; the module lists delegates newest first, hence the reverse.
  await execute(provider, safeAddress, signers, multiSend(allowanceSetupCalls(safeAddress, [...allowances].reverse())))
  for (const allowance of allowances.filter(({ spent }) => spent))
    await spendAllowance(provider, safeAddress, allowance)
}

async function advanceNonce(provider, safeAddress, signers, nonce) {
  const safe = new Contract(safeAddress, safeAbi, provider)
  if (nonce > Number(await safe.nonce()) + 1) {
    // Jump instead of replaying empty transactions; TXS trusts its records once one real execution lands.
    await provider.send('anvil_setStorageAt', [safeAddress, SAFE_NONCE_SLOT, toBeHex(nonce - 1, 32)])
  }
  for (let current = Number(await safe.nonce()); current < nonce; current++) {
    await execute(provider, safeAddress, signers, { to: safeAddress })
  }
}

/**
 * Deploys a Safe with the owners, threshold, nonce, spending limits and balances of a staging Safe.
 * Staging wallets that sign in tests map to the generated owners; other addresses stay as on staging.
 */
export async function rebuildStagingSafe(env, owners, snapshot) {
  const built = await buildStagingSafe(env, owners, snapshot)
  await built.indexed()
  return built.safeAddress
}

/** Rebuilds the Safe on chain; `indexed()` waits until CGW serves it as the snapshot describes. */
export async function buildStagingSafe(env, owners, snapshot) {
  const { owners: stagingOwners, threshold, nonce = 0, allowances = [], ether = 0n, tokens = [] } = snapshot
  const ownerAddresses = stagingOwners.map((address) => localAddress(owners, address))
  // TXS skips token transfers to a Safe it does not know yet, so only a Safe without tokens may skip this wait.
  const context = await createSafe(env, owners, { ownerAddresses, threshold, waitForIndexing: tokens.length > 0 })
  const { provider, safeAddress, path } = context
  try {
    const signers = ownerAddresses.slice(0, threshold)
    const local = allowances.map((allowance) => ({ ...allowance, delegate: localAddress(owners, allowance.delegate) }))
    if (local.length) await addAllowances(env, provider, safeAddress, signers, local)
    await advanceNonce(provider, safeAddress, signers, nonce)
    for (const { address, amount } of tokens) {
      await fundWithToken(provider, { token: address, holder: owners.owner4.address, recipient: safeAddress, amount })
    }
    await provider.send('anvil_setBalance', [safeAddress, toQuantity(ether)])
  } finally {
    provider.destroy()
  }
  const indexed = async () => {
    const hasModule = (safe) => safe.modules?.some(({ value }) => value === ALLOWANCE_MODULE)
    await waitUntil(
      env,
      path,
      (safe) => safe.threshold === threshold && safe.nonce === nonce && (!allowances.length || hasModule(safe)),
    )
    await waitUntil(env, `${path}/balances/usd?trusted=false`, (balances) =>
      tokens.every(({ address }) => balances.items.some(({ tokenInfo }) => tokenInfo.address === address)),
    )
  }
  return { safeAddress, indexed }
}
