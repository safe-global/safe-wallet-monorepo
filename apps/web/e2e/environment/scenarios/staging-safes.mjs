import { parseEther, parseUnits } from 'ethers'
import { buildStagingSafe, stagingOwners } from './staging.mjs'
import { onChain } from './safe.mjs'
import { SEPOLIA } from './chain.mjs'
import { COW, DAI } from './cow-protocol.mjs'

const { owner1, owner3, owner4, sepoliaOwner2 } = stagingOwners
const beneficiary = '0x4c8bF5541D21288836F5B7AdE01E102F074c5F4a'
const automationOwner = '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8'
const sharedOwner = '0xb43470d6913f548Bf90E299De2fe3f94140aaf7c'
export const polygonOwner = '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0'

const shortNames = { [SEPOLIA]: 'sep', 1: 'eth', 137: 'matic' }

// On-chain state of the staging static Safes at the fork block; `chainId` defaults to Sepolia.
export const stagingSafes = {
  SEP_STATIC_SAFE_1: {
    owners: [
      owner1,
      owner4,
      '0x01A9F68e339da12565cfBc47fe7D6EdEcB11C46f',
      '0x8a39cE4E27C326B87B75AaFf820D442311CD8E4E',
      '0x9c7a96d86BC4f5a6DeC9664C67CC02E3d4591e24',
    ],
    threshold: 2,
    nonce: 27,
    ether: parseEther('4.0002198'),
    tokens: [
      { address: COW, amount: parseEther('7981') },
      { address: DAI, amount: 4576302406975958516181n },
      { address: '0xd3f3d46FeBCD4CdAa2B83799b7A5CdcB69d135De', amount: parseEther('1000') },
    ],
  },
  SEP_STATIC_SAFE_3: { owners: [sepoliaOwner2], threshold: 1, ether: parseEther('0.001') },
  SEP_STATIC_SAFE_4: { owners: [owner4], threshold: 1, nonce: 3, ether: parseEther('0.000001') },
  SEP_STATIC_SAFE_6: { owners: [owner3, owner4], threshold: 1, nonce: 5, ether: parseEther('0.00998') },
  SEP_STATIC_SAFE_7: { owners: [owner3, owner4, sepoliaOwner2], threshold: 2, nonce: 17, ether: parseEther('0.4424') },
  SEP_STATIC_SAFE_8: {
    owners: [beneficiary, owner4, sepoliaOwner2],
    threshold: 1,
    nonce: 7,
    ether: parseEther('0.12999'),
    allowances: [
      { delegate: owner4, amount: parseEther('0.17'), spent: parseEther('0.02') },
      {
        delegate: '0x52835f11E348605E9D791Ec09380a3224526d538',
        amount: parseEther('0.05'),
        spent: parseEther('0.00001'),
      },
      { delegate: beneficiary, amount: parseEther('0.01') },
    ],
    tokens: [{ address: '0x8Eacc9DCa0b92C360D7896Aa5907b949C2A846f6', amount: parseEther('5') }],
  },
  SEP_STATIC_SAFE_9: {
    owners: [sepoliaOwner2, owner4],
    threshold: 2,
    nonce: 3,
    ether: parseEther('0.0009'),
    allowances: [{ delegate: owner4, amount: parseEther('0.0001') }],
  },
  SEP_STATIC_SAFE_10: {
    owners: [sepoliaOwner2, automationOwner, owner4],
    threshold: 2,
    nonce: 5,
    ether: parseEther('0.00948'),
  },
  SEP_STATIC_SAFE_11: {
    owners: [automationOwner],
    threshold: 1,
    nonce: 1,
    allowances: [{ delegate: owner4, amount: parseEther('1') }],
  },
  SEP_STATIC_SAFE_13: { owners: [sepoliaOwner2, owner4], threshold: 1, nonce: 1 },
  SEP_STATIC_SAFE_23: {
    owners: [owner4],
    threshold: 1,
    nonce: 1,
    ether: parseEther('0.0002'),
    allowances: [{ delegate: owner4, amount: parseEther('0.0001') }],
  },
  SEP_STATIC_SAFE_24: { owners: [owner4, owner1], threshold: 2, nonce: 2 },
  SEP_STATIC_SAFE_26: { owners: [owner1, owner4], threshold: 2, nonce: 1 },
  SEP_STATIC_SAFE_34: {
    owners: [owner4, sepoliaOwner2],
    threshold: 2,
    tokens: [{ address: COW, amount: parseEther('800') }],
  },
  SEP_STATIC_SAFE_35: { owners: [owner4, owner3], threshold: 1, nonce: 1, ether: parseEther('0.003') },
  // The Sepolia Safe at the address of the Polygon static Safe.
  MATIC_STATIC_SAFE_28: {
    owners: [owner1, owner4],
    threshold: 1,
    nonce: 3,
    ether: parseEther('0.000114'),
    tokens: [{ address: COW, amount: parseEther('500') }],
  },
  SEP_STATIC_SAFE_31: { owners: [owner3, owner4], threshold: 1, nonce: 1, ether: parseEther('0.000001') },
  SEP_STATIC_SAFE_36: { owners: [owner4], threshold: 1, ether: parseEther('0.0004') },
  SEP_STATIC_SAFE_43: {
    owners: [automationOwner, owner4, sharedOwner],
    threshold: 1,
    ether: parseEther('0.001'),
    tokens: [
      { address: DAI, amount: parseEther('5') },
      { address: '0x58Eb19eF91e8A6327FEd391b51aE1887b833cc91', amount: 6_000_000n },
      { address: '0xEbCC972B6B3eB15C0592BE1871838963d0B94278', amount: 7_000_000n },
      { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', amount: parseEther('0.002') },
    ],
  },
  SEP_STATIC_SAFE_42: { owners: [owner4], threshold: 1, ether: parseEther('0.0003') },
  SEP_STATIC_SAFE_47: { owners: [sharedOwner, owner4], threshold: 1, ether: parseEther('0.001') },
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
  MATIC_STATIC_SAFE_30: {
    chainId: 137,
    owners: [owner3, owner4, owner1, polygonOwner],
    threshold: 2,
    nonce: 3,
    ether: parseEther('0.00999'),
    tokens: [
      { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', amount: parseEther('0.01') }, // AAVE
      { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', amount: parseEther('1') }, // DAI
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', amount: 100n }, // USDT0
    ],
  },
  MATIC_STATIC_SAFE_33: {
    chainId: 137,
    owners: [sharedOwner, '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd', owner4],
    threshold: 1,
    nonce: 19,
    ether: parseEther('13.61'),
  },
  MATIC_STATIC_SAFE_34: { chainId: 137, owners: [sharedOwner, owner4], threshold: 1, ether: parseEther('0.11') },
  // Funds category; its 575 executed transactions are not replayed.
  ETH_FUNDS_SAFE_13: {
    chainId: 1,
    owners: ['0xd0ba955b8F34561907Abb588603a2400e06BD2d2', '0x4c3c38a459F0bAABB763290111B66ed01b5fEfA2', polygonOwner],
    threshold: 2,
    ether: 1137693581890135n,
  },
}

// On-chain state of the staging Safe App Safes at the fork block.
export const stagingSafeAppSafes = {
  SEP_SAFEAPP_SAFE_1: { owners: [owner1, sepoliaOwner2, owner4], threshold: 2, nonce: 2 },
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
