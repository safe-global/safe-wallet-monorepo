import { ContractFactory, NonceManager, parseEther } from 'ethers'
import { createSafe } from './safe.mjs'
import { waitUntil } from './indexing.mjs'
import { erc20Artifact } from './chain.mjs'

export async function prepareAssetsScenario(env, owners, count = 6) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    const signer = new NonceManager(context.signer)
    const definitions = [
      ['AAVE', 'AAVE', '27'],
      ['TestTokenA', 'TT_A', '15'],
      ['TestTokenB', 'TT_B', '21'],
      ['USDC', 'USDC', '73'],
      ['LINK', 'LINK', '35.94'],
      ['DAI', 'DAI', '82'],
      ...Array.from({ length: count - 6 }, (_, i) => [`Pagination token ${i}`, `PAGE${i}`, `${i + 1}`]),
    ]
    const tokens = []
    for (const [name, symbol, amount] of definitions.slice(0, count)) {
      const token = await new ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer).deploy(
        name,
        symbol,
        parseEther(amount),
        context.safeAddress,
      )
      await token.waitForDeployment()
      tokens.push({ address: await token.getAddress(), amount: parseEther(amount).toString(), symbol })
    }
    await waitUntil(
      env,
      `${env.SAFE_TXS_BASE_URL}/v1/safes/${context.safeAddress}/balances/?trusted=false`,
      (balances) =>
        tokens.every((token) =>
          balances.some((balance) => balance.tokenAddress === token.address && balance.balance === token.amount),
        ),
    )
    await waitUntil(
      env,
      `${context.path}/balances/USD?trusted=false&exclude_spam=false`,
      (balances) =>
        balances.items?.some((item) => item.tokenInfo.type === 'NATIVE_TOKEN' && Number(item.fiatBalance) > 0) &&
        tokens.every((token) =>
          balances.items?.some((item) => item.tokenInfo.address === token.address && item.balance === token.amount),
        ),
    )
    return {
      safes: {
        static: { SEP_STATIC_SAFE_2: `sep:${context.safeAddress}`, SEP_STATIC_SAFE_3: `sep:${context.safeAddress}` },
      },
    }
  } finally {
    context.provider.destroy()
  }
}
