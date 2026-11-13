import { parseEther, parseUnits } from 'ethers'
import { buildStagingSafe } from './staging.mjs'
import { onChain } from './safe.mjs'
import { SEPOLIA } from './chain.mjs'

const shortNames = { [SEPOLIA]: 'sep', 1: 'eth', 137: 'matic' }

// On-chain state of the staging static Safes at the fork block; `chainId` defaults to Sepolia.
const stagingSafes = {
  ETH_STATIC_SAFE_15: {
    chainId: 1,
    owners: [
      '0x9F87C1aCaF3Afc6a5557c58284D9F8609470b571',
      '0x8712128BEA09C9687Df05A5D692F3750F8086C81',
      '0x80F59C1D46EFC1Bb18F0AaEc132b77266f00Be9a',
      '0x9F7dfAb2222A473284205cdDF08a677726d786A0',
    ],
    threshold: 2,
    nonce: 20,
    ether: 11330920357610092973n,
    tokens: [
      { address: '0x6810e776880C02933D47DB1b9fc05908e5386b96', amount: parseEther('100') }, // GNO
      { address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe', amount: 1697353479443976078165n }, // SAFE
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', amount: parseUnits('26.87', 6) }, // USDT
      { address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', amount: parseEther('1.2') }, // SAI
      { address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', amount: parseEther('100') }, // OMG
      { address: '0x1A5F9352Af8aF974bFC03399e3767DF6370d82e4', amount: parseEther('3') }, // OWL
      { address: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC', amount: parseUnits('1.825', 8) }, // cSAI
      { address: '0xd2877702675e6cEb975b4A1dFf9fb7BAF4C91ea9', amount: parseEther('0.004583') }, // LUNC
      { address: '0x7701996420A116F25bD414c02381f6DB698bF2EB', amount: parseEther('5') }, // BUN
    ],
  },
}

/** Rebuilds the named staging Safes, each on its own chain, and returns them as the static Safe category. */
export async function rebuildStagingSafes(env, owners, names) {
  // Chain work stays sequential because the Safes share senders; one indexing wait then covers all of them.
  const built = []
  for (const name of names) {
    const { chainId = SEPOLIA, ...snapshot } = stagingSafes[name]
    built.push({ name, chainId, safe: await buildStagingSafe(onChain(env, chainId), owners, snapshot) })
  }
  await Promise.all(built.map(({ safe }) => safe.indexed()))
  return Object.fromEntries(
    built.map(({ name, chainId, safe }) => [name, `${shortNames[chainId]}:${safe.safeAddress}`]),
  )
}
