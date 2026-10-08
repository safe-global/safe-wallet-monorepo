import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { NonceManager, Wallet, parseEther, randomBytes, hexlify } from 'ethers'
import { chainProfiles } from '../local-stack.mjs'
import { FUNDED_BALANCE, SEPOLIA } from './chain.mjs'
import { waitUntil } from './indexing.mjs'
import { localProvider, sendAndConfirm } from './provider.mjs'

/** Fresh wallets for the specs' OWNER_1 to OWNER_4 credentials; OWNER_4 proposes and deploys. */
export function createOwners() {
  const [owner1, owner2, owner3] = Array.from({ length: 3 }, () => Wallet.createRandom())
  // Like staging OWNER_4 (0xC16D…), it sorts after the specs' recipient 0x6a56… in address order.
  let owner4 = Wallet.createRandom()
  while (!/^0x[7-9a-f]/i.test(owner4.address)) owner4 = Wallet.createRandom()
  const wallets = { owner1, owner2, owner3, owner4 }
  const credentials = Object.fromEntries(
    Object.entries(wallets).flatMap(([name, wallet]) => {
      const key = name.replace('owner', 'OWNER_')
      return [
        [`${key}_PRIVATE_KEY`, wallet.privateKey],
        [`${key}_WALLET_ADDRESS`, wallet.address],
      ]
    }),
  )
  return { ...wallets, credentials }
}

/** Scenario environment for a forked chain; Sepolia is the default stack itself. */
export function onChain(env, chainId) {
  if (Number(chainId) === SEPOLIA) return env
  const chain = env.SAFE_E2E_CHAINS?.[chainId]
  if (!chain) {
    throw new Error(`Chain ${chainId} is not running; start it with test_env.py up --chain ${chainProfiles[chainId]}`)
  }
  return {
    ...env,
    SAFE_CHAIN_ID: Number(chainId),
    SAFE_RPC_URL: chain.rpcUrl,
    SAFE_TXS_BASE_URL: chain.transactionServiceUrl,
    SAFE_TXS_SERVICE: `txs-web-${chainProfiles[chainId]}`,
  }
}

async function assertForkChain(provider, env) {
  const chainId = (await provider.getNetwork()).chainId
  const expected = BigInt(env.SAFE_CHAIN_ID ?? SEPOLIA)
  if (chainId !== expected) throw new Error(`Expected the fork of chain ${expected}, found ${chainId}`)
  return chainId
}

const randomSaltNonce = () => BigInt(hexlify(randomBytes(16))).toString()

/** Deploys a Safe 1.4.1 L2 with `owners` and `threshold` and gives it 1 ETH; returns its address. */
async function deploySafe(env, signer, { owners, threshold, saltNonce = randomSaltNonce() }) {
  const predicted = await Safe.init({
    provider: env.SAFE_RPC_URL,
    signer: signer.privateKey,
    isL1SafeSingleton: false,
    predictedSafe: {
      safeAccountConfig: { owners, threshold },
      safeDeploymentConfig: { safeVersion: '1.4.1', saltNonce },
    },
  })
  const safeAddress = await predicted.getAddress()
  const deployer = new NonceManager(signer)
  await sendAndConfirm(deployer, await predicted.createSafeDeploymentTransaction())
  await sendAndConfirm(deployer, { to: safeAddress, value: parseEther('1') })
  return safeAddress
}

/**
 * Deploys a Safe as `owners.owner4` and returns a context for SDK flows on it. Without `ownerAddresses` the
 * Safe belongs to OWNER_4 and OWNER_1; `waitForIndexing` waits until CGW serves it.
 */
export async function createSafe(env, owners, options = {}) {
  const { ownerAddresses, threshold = 2, saltNonce, waitForIndexing = true } = options
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    const chainId = await assertForkChain(provider, env)
    for (const owner of [owners.owner4, owners.owner1, owners.owner2, owners.owner3]) {
      await provider.send('anvil_setBalance', [owner.address, FUNDED_BALANCE])
    }
    const signer = owners.owner4.connect(provider)
    const safeOwners = ownerAddresses ?? [signer.address, owners.owner1.address]
    const safeAddress = await deploySafe(env, signer, { owners: safeOwners, threshold, saltNonce })
    const path = `${env.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/safes/${safeAddress}`
    if (waitForIndexing) await waitUntil(env, path, (safe) => safe.threshold === threshold && safe.nonce === 0)
    const safe = await Safe.init({ provider: env.SAFE_RPC_URL, signer: signer.privateKey, safeAddress })
    const api = new SafeApiKit({ chainId, txServiceUrl: env.SAFE_TXS_BASE_URL })
    return { env, provider, safe, api, path, safeAddress, signer, chainId }
  } catch (error) {
    provider.destroy()
    throw error
  }
}

/** Deploys a Safe for data that needs only its address; takes the options of createSafe. */
export async function createSafeAddress(env, owners, options) {
  const context = await createSafe(env, owners, options)
  context.provider.destroy()
  return context.safeAddress
}

/** The Transaction Service client and CGW path of an existing Safe, for flows that need no signer. */
export function safeService(env, safeAddress) {
  const chainId = BigInt(env.SAFE_CHAIN_ID ?? SEPOLIA)
  return {
    env,
    safeAddress,
    chainId,
    path: `${env.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/safes/${safeAddress}`,
    api: new SafeApiKit({ chainId, txServiceUrl: env.SAFE_TXS_BASE_URL }),
  }
}

/** A context like createSafe's for an existing Safe, signing as `owner`; it opens no provider to destroy. */
export async function openSafe(env, owner, safeAddress) {
  const safe = await Safe.init({ provider: env.SAFE_RPC_URL, signer: owner.privateKey, safeAddress })
  return { ...safeService(env, safeAddress), safe, signer: owner }
}

/**
 * Signs `transaction` as `proposer` (the context's owner by default, or `{ safe, signer }` of another owner) and
 * proposes it to the Transaction Service, with an optional `origin` such as a transaction note.
 */
export async function proposeTransaction(context, transaction, { proposer = context, origin } = {}) {
  const signed = await proposer.safe.signTransaction(transaction)
  const hash = await context.safe.getTransactionHash(signed)
  await context.api.proposeTransaction({
    safeAddress: context.safeAddress,
    safeTransactionData: signed.data,
    safeTxHash: hash,
    senderAddress: proposer.signer.address,
    senderSignature: signed.encodedSignatures(),
    origin,
  })
  return { signed, hash, id: `&id=multisig_${context.safeAddress}_${hash}` }
}

// Protocol Kit reads the next nonce from the chain, so a series of executions can skip the wait until its last step.
export async function executeTransaction(context, transaction, { waitForIndexing = true } = {}) {
  const signed = await context.safe.signTransaction(transaction)
  const execution = await context.safe.executeTransaction(signed)
  const receipt = await context.provider.waitForTransaction(execution.hash, 1, 60_000)
  if (receipt?.status !== 1) throw new Error('Scenario transaction execution failed')
  if (!waitForIndexing) return
  await waitUntil(context.env, `${context.path}/transactions/history`, (history) =>
    JSON.stringify(history).includes(execution.hash),
  )
  await waitUntil(context.env, context.path, (safe) => safe.nonce === Number(transaction.data.nonce) + 1)
}
