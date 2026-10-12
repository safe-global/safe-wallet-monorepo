import { hexlify, randomBytes } from 'ethers'
import { createSafe, executeTransaction, onChain } from './safe.mjs'
import { polygonOwner, rebuildStagingSafes } from './staging-safes.mjs'
import { registerTokens, trustTokens } from './tokens.mjs'
import { SEPOLIA } from './chain.mjs'

// On-chain these report DAI, cDAI and LUNA; the hosted Transaction Service lists the curated names.
const curatedTokens = [
  { address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', name: 'Sai', symbol: 'SAI', decimals: 18 },
  { address: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC', name: 'Compound Sai', symbol: 'cSAI', decimals: 8 },
  { address: '0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9', name: 'Wrapped LUNC', symbol: 'LUNC', decimals: 18 },
]

// Tokens the staging portfolio lists by default for ETH_STATIC_SAFE_15; locally the trusted flag selects them.
const defaultTokens = [
  '0x6810e776880C02933D47DB1b9fc05908e5386b96', // GNO
  '0x5aFE3855358E112B5647B952709E6165e1c1eEEe', // SAFE
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
  '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', // OMG
  '0x1A5F9352Af8aF974bFC03399e3767DF6370d82e4', // OWL
]

/** Deploys the same Safe, with one salt and one setup, on each chain so it gets the same address everywhere. */
export async function createMultichainSafe(env, owners, chainIds, options) {
  const saltNonce = BigInt(hexlify(randomBytes(16))).toString()
  const contexts = {}
  for (const chainId of chainIds) {
    contexts[chainId] = await createSafe(onChain(env, chainId), owners, { ...options, saltNonce })
  }
  if (new Set(Object.values(contexts).map(({ safeAddress }) => safeAddress)).size !== 1) {
    throw new Error('Multichain Safe got different addresses; check the factory and singleton on every fork')
  }
  return contexts
}

async function addOwners(context, additions) {
  for (const { ownerAddress, threshold } of additions) {
    await executeTransaction(context, await context.safe.createAddOwnerTx({ ownerAddress, threshold }))
  }
}

/**
 * MATIC_STATIC_SAFE_28: one Safe on Polygon and Sepolia with the signer setups of staging, which diverged after
 * the shared creation with OWNER_4 as the only owner.
 */
export async function prepareMultichainScenario(env, owners) {
  const contexts = await createMultichainSafe(env, owners, [SEPOLIA, 137], {
    ownerAddresses: [owners.owner4.address],
    threshold: 1,
  })
  try {
    await addOwners(contexts[SEPOLIA], [{ ownerAddress: owners.owner1.address, threshold: 1 }])
    await addOwners(contexts[137], [
      { ownerAddress: owners.owner3.address, threshold: 1 },
      { ownerAddress: owners.owner1.address, threshold: 1 },
      { ownerAddress: polygonOwner, threshold: 2 },
    ])
    return { safes: { static: { MATIC_STATIC_SAFE_28: `matic:${contexts[137].safeAddress}` } } }
  } finally {
    for (const context of Object.values(contexts)) context.provider.destroy()
  }
}

export async function prepareBalancesEndpointsScenario(env, owners) {
  const mainnet = onChain(env, 1)
  await registerTokens(mainnet, curatedTokens)
  const safes = await rebuildStagingSafes(env, owners, ['ETH_STATIC_SAFE_15'])
  await trustTokens(mainnet, defaultTokens)
  return { safes: { static: safes } }
}

export async function prepareCopilotScenario(env, owners) {
  return { safes: { static: await rebuildStagingSafes(env, owners, ['MATIC_STATIC_SAFE_30']) } }
}

export async function preparePortfolioScenario(env, owners) {
  return { safes: { static: await rebuildStagingSafes(env, owners, ['MATIC_STATIC_SAFE_33']) } }
}
