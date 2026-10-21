import { Wallet, getAddress } from 'ethers'
import { fundWithToken } from '../../environment/scenarios/chain.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { trustToken } from '../../environment/scenarios/tokens.mjs'
import { readChain } from '../chain/local-provider'
import type { SeededSafe } from './safe'

export type SeedToken = { address: string; symbol: string; decimals: number }

/** Circle's USDC on Sepolia, which the fork serves as deployed: a proxied token with 6 decimals. */
export const SEPOLIA_USDC: SeedToken = {
  address: getAddress('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'),
  symbol: 'USDC',
  decimals: 6,
}

type TxsBalance = { tokenAddress: string | null; balance: string }
type CgwBalances = { items: Array<{ tokenInfo: { address: string }; balance: string }> }

/** Transfers `amount` base units of `token` to the Safe, trusts the token, and waits until CGW lists the balance. */
export async function seedTokenBalance(
  safe: SeededSafe,
  { token, amount }: { token: SeedToken; amount: bigint },
): Promise<void> {
  const { env, path } = safe.context
  // A real Transfer event, because the indexer finds ERC-20 balances from Transfer events.
  const holder = Wallet.createRandom().address
  await readChain(env, (provider) =>
    fundWithToken(provider, { token: token.address, holder, recipient: safe.address, amount }),
  )
  const balance = amount.toString()
  // CGW caches its first answer, so wait for the indexer before CGW is asked.
  await waitUntil(
    env,
    `${env.SAFE_TXS_BASE_URL}/v1/safes/${safe.address}/balances/?trusted=false`,
    (balances: TxsBalance[]) =>
      balances.some((item) => item.tokenAddress === token.address && item.balance === balance),
  )
  await trustToken(env, token.address)
  await waitUntil(env, `${path}/balances/usd?trusted=true&exclude_spam=true`, (balances: CgwBalances) =>
    balances.items.some((item) => item.tokenInfo.address === token.address && item.balance === balance),
  )
}
