import { toQuantity } from 'ethers'
import { prepareAssetsScenario } from './assets.mjs'

import { localProvider } from './provider.mjs'
import { waitUntil } from './indexing.mjs'
import { addressOf, SEPOLIA } from './chain.mjs'

const stagingSafe2Balance = 99964149996900000n

// The batch fixtures belong to staging SEP_STATIC_SAFE_2, so it also gets the staging ETH balance.
export async function prepareBatchScenario(env, owners) {
  const scenario = await prepareAssetsScenario(env, owners)
  const safeAddress = addressOf(scenario.safes.static.SEP_STATIC_SAFE_2)
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    await provider.send('anvil_setBalance', [safeAddress, toQuantity(stagingSafe2Balance)])
  } finally {
    provider.destroy()
  }
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v1/chains/${SEPOLIA}/safes/${safeAddress}/balances/usd?trusted=false`,
    (balances) =>
      balances.items.some(
        (item) => item.tokenInfo.type === 'NATIVE_TOKEN' && item.balance === stagingSafe2Balance.toString(),
      ),
  )
  return scenario
}
