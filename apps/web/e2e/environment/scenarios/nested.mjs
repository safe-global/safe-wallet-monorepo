import { ContractFactory, NonceManager, parseEther } from 'ethers'
import { getProxyFactoryDeployment } from '@safe-global/safe-deployments'
import { createSafe } from './safe.mjs'
import { registerContracts } from './contracts.mjs'
import { trustToken } from './tokens.mjs'
import { waitUntil } from './indexing.mjs'
import { erc20Artifact, SEPOLIA, short } from './chain.mjs'

// The wallet deploys nested Safes through the recommended 1.5.0 factory; the decoder needs its ABI as on staging.
async function registerFactory(env) {
  await registerContracts(
    env,
    ['1.4.1', '1.5.0'].map((version) => {
      const deployment = getProxyFactoryDeployment({ version, network: String(SEPOLIA) })
      return {
        address: deployment.networkAddresses[SEPOLIA],
        chainId: SEPOLIA,
        name: `SafeProxyFactory ${version}`,
        abi: deployment.abi,
      }
    }),
  )
}

/** Deploys a Safe owned by `parent` and waits until TXS records `deployers.owner4` as its creator. */
async function createNestedSafe(env, deployers, parent) {
  const child = await createSafe(env, deployers, { ownerAddresses: [parent.safeAddress], threshold: 1 })
  try {
    await waitUntil(
      env,
      `${child.path}/transactions/creation`,
      (creation) => creation.creator?.toLowerCase() === deployers.owner4.address.toLowerCase(),
    )
    return child
  } catch (error) {
    child.provider.destroy()
    throw error
  }
}

const waitForNestedSafes = (env, parent, children) =>
  waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v1/chains/${SEPOLIA}/owners/${parent.safeAddress}/safes`,
    (result) =>
      result.safes?.length === children.length && children.every((child) => result.safes.includes(child.safeAddress)),
  )

const nestedFixtures = (root, first, second) => ({
  safes: {
    static: {
      SEP_STATIC_SAFE_39: `sep:${root.safeAddress}`,
      SEP_STATIC_SAFE_40: `sep:${first.safeAddress}`,
      SEP_STATIC_SAFE_41: `sep:${second.safeAddress}`,
      SEP_STATIC_SAFE_46: `sep:${root.safeAddress}`,
    },
  },
  fixtures: { 'nested.safe1Short': short(first.safeAddress), 'nested.safe2Short': short(second.safeAddress) },
})

/** A root Safe that owns a nested Safe, which owns another nested Safe. */
export async function prepareNestedScenario(env, owners) {
  const contexts = []
  try {
    const root = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
    contexts.push(root)
    const child = await createNestedSafe(env, owners, root)
    contexts.push(child)
    const grandchild = await createNestedSafe(env, owners, child)
    contexts.push(grandchild)
    await waitForNestedSafes(env, root, [child])
    await waitForNestedSafes(env, child, [grandchild])
    await registerFactory(env)
    return nestedFixtures(root, child, grandchild)
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
}

// The curation list marks nested Safes that another owner deployed, so the last two come from OWNER_1.
const CURATED_CHILDREN = 8
const FOREIGN_DEPLOYMENTS = 2

/** A root Safe that owns eight nested Safes, two of them deployed by another owner. */
export async function prepareNestedCurationScenario(env, owners) {
  const contexts = []
  try {
    const root = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
    contexts.push(root)
    const foreign = { ...owners, owner4: owners.owner1, owner1: owners.owner4 }
    for (let index = 0; index < CURATED_CHILDREN; index++) {
      const deployers = index >= CURATED_CHILDREN - FOREIGN_DEPLOYMENTS ? foreign : owners
      contexts.push(await createNestedSafe(env, deployers, root))
    }
    const children = contexts.slice(1)
    await waitForNestedSafes(env, root, children)
    await registerFactory(env)
    return nestedFixtures(root, children[0], children[1])
  } finally {
    for (const context of contexts) context.provider.destroy()
  }
}

export async function prepareNestedFundingScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    await context.provider.send('anvil_setBalance', [context.safeAddress, `0x${parseEther('0.00002').toString(16)}`])
    const token = await new ContractFactory(
      erc20Artifact.abi,
      erc20Artifact.bytecode,
      new NonceManager(context.signer),
    ).deploy('CoW Protocol Token', 'COW', parseEther('10'), context.safeAddress)
    await token.waitForDeployment()
    const tokenAddress = await token.getAddress()
    await waitUntil(
      env,
      `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/balances/?trusted=false`,
      (balances) => balances.some((balance) => balance.tokenAddress === tokenAddress),
    )
    await trustToken(env, tokenAddress)
    await registerFactory(env)
    await waitUntil(
      env,
      `${context.path}/balances/USD?trusted=true&exclude_spam=false`,
      (balances) =>
        balances.items?.some((item) => item.tokenInfo.address === tokenAddress) &&
        balances.items?.some(
          (item) => item.tokenInfo.type === 'NATIVE_TOKEN' && item.balance === parseEther('0.00002').toString(),
        ),
    )
    return {
      safes: { static: { SEP_STATIC_SAFE_45: `sep:${context.safeAddress}` } },
    }
  } finally {
    context.provider.destroy()
  }
}
