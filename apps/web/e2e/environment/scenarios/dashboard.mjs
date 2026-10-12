import { Interface, Wallet, parseEther } from 'ethers'
import { createSafe, createSafeAddress, executeTransaction, proposeTransaction } from './safe.mjs'
import { waitForQueued, waitUntil } from './indexing.mjs'

const SAFE_L2_SINGLETON_141 = '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'
const SAFE_L1_SINGLETON_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
const SAFE_MIGRATION_141 = '0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6'
const DELEGATE_CALL = 1

export async function prepareDashboardScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    // Two proposals share nonce 0; the widget shows only the most recent one.
    const hashes = []
    for (const value of ['0.00001', '0.00002']) {
      const transaction = await context.safe.createTransaction({
        transactions: [{ to: owners.owner1.address, value: parseEther(value).toString(), data: '0x' }],
        options: { nonce: 0 },
      })
      hashes.push((await proposeTransaction(context, transaction)).hash)
    }
    await waitForQueued(env, context, hashes)
    return { safes: { static: { SEP_STATIC_SAFE_2: `sep:${context.safeAddress}` } } }
  } finally {
    context.provider.destroy()
  }
}

/** Contract creation code that deploys `runtime` unchanged. */
export const creationCode = (runtime) => {
  const size = (runtime.length - 2) / 2
  return `0x61${size.toString(16).padStart(4, '0')}80600c6000396000f3${runtime.slice(2)}`
}

async function deployContract(context, runtime) {
  const receipt = await (await context.signer.sendTransaction({ data: creationCode(runtime) })).wait()
  if (!receipt?.contractAddress) throw new Error('Scenario contract deployment failed')
  return receipt.contractAddress
}

/** Replaces the Safe's singleton through a delegatecall and waits until CGW reports it as unknown. */
async function switchSingleton(context, { to, data }, singleton) {
  const transaction = await context.safe.createTransaction({
    transactions: [{ to, value: '0', data, operation: DELEGATE_CALL }],
  })
  await executeTransaction(context, transaction)
  await waitUntil(
    context.env,
    context.path,
    (safe) =>
      safe.implementation?.value?.toLowerCase() === singleton.toLowerCase() &&
      safe.implementationVersionState === 'UNKNOWN',
  )
}

async function prepareMigratableSafe(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const data = new Interface(['function migrateSingleton()']).encodeFunctionData('migrateSingleton')
    await switchSingleton(context, { to: SAFE_MIGRATION_141, data }, SAFE_L1_SINGLETON_141)
    return context.safeAddress
  } finally {
    context.provider.destroy()
  }
}

async function prepareUnofficialSingletonSafe(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    // A working singleton whose bytecode hash matches no official deployment.
    const singleton = await deployContract(context, `${await context.provider.getCode(SAFE_L2_SINGLETON_141)}00`)
    const slotWriter = await deployContract(context, `0x73${singleton.slice(2)}60005500`)
    await switchSingleton(context, { to: slotWriter, data: '0x' }, singleton)
    return context.safeAddress
  } finally {
    context.provider.destroy()
  }
}

async function prepareQueuedBatchesSafe(env, owners) {
  const context = await createSafe(env, owners)
  try {
    const transfer = { to: owners.owner1.address, value: '1', data: '0x' }
    const transactions = [
      await context.safe.createTransaction({ transactions: [transfer, transfer, transfer], options: { nonce: 0 } }),
      await context.safe.createAddOwnerTx({ ownerAddress: Wallet.createRandom().address }, { nonce: 1 }),
      await context.safe.createTransaction({ transactions: [transfer, transfer], options: { nonce: 2 } }),
    ]
    const hashes = []
    for (const transaction of transactions) hashes.push((await proposeTransaction(context, transaction)).hash)
    await waitForQueued(env, context, hashes)
    return context.safeAddress
  } finally {
    context.provider.destroy()
  }
}

const prepareEmptyQueueSafe = (env, owners) =>
  createSafeAddress(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })

export async function prepareDashboardRegressionScenario(env, owners) {
  const { safes } = await prepareDashboardScenario(env, owners)
  return {
    safes: {
      static: {
        ...safes.static,
        SEP_STATIC_SAFE_12: `sep:${await prepareQueuedBatchesSafe(env, owners)}`,
        SEP_STATIC_SAFE_14: `sep:${await prepareEmptyQueueSafe(env, owners)}`,
        // The hosted suite uses Polygon Safes; only their unsupported singletons matter here.
        MATIC_STATIC_SAFE_31: `sep:${await prepareMigratableSafe(env, owners)}`,
        MATIC_STATIC_SAFE_32: `sep:${await prepareUnofficialSingletonSafe(env, owners)}`,
      },
    },
  }
}
