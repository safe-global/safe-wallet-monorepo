import { Wallet, getAddress } from 'ethers'
import { fundWithToken } from '../../environment/scenarios/chain.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { registerTokens, trustToken } from '../../environment/scenarios/tokens.mjs'
import { readChain } from '../chain/local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import type { SeededSafe } from './safe'

export type SeedToken = { address: string; symbol: string; decimals: number }

/** Circle's USDC on Sepolia, which the fork serves as deployed: a proxied token with 6 decimals. */
export const SEPOLIA_USDC: SeedToken = {
  address: getAddress('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'),
  symbol: 'USDC',
  decimals: 6,
}

/** CoW Protocol's COW on Sepolia: an ERC-20 with 18 decimals that the popular-token list of the policies leaves out. */
export const SEPOLIA_COW: SeedToken = {
  address: getAddress('0x0625afb445c3b6b7b929342a04a22599fd5dbb59'),
  symbol: 'COW',
  decimals: 18,
}

/** Aave's GHO on Sepolia: an ERC-20 with 18 decimals that no other spec trusts, so it stays untrusted. */
export const SEPOLIA_GHO: SeedToken & { name: string } = {
  address: getAddress('0xc4bf5cbdabe595361438f8c6a187bdc330539c60'),
  symbol: 'GHO',
  decimals: 18,
  name: 'Gho Token',
}

/** Lists `token` as trusted in the Transaction Service, which CGW asks for its metadata, without a balance for any Safe. */
export async function seedKnownToken(env: JourneyEnvironment, token: SeedToken): Promise<void> {
  await trustToken(env, token.address)
}

/** Lists `token` in the Transaction Service without trusting it, without a balance for any Safe. */
export async function seedUntrustedToken(env: JourneyEnvironment, token: SeedToken & { name: string }): Promise<void> {
  await registerTokens(env, [token])
}

type TxsBalance = { tokenAddress: string | null; balance: string }
type CgwBalances = { items: Array<{ tokenInfo: { address: string; type: string }; balance: string }> }

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

/** Waits until CGW lists the 1 ETH that `seedSafe` sends, so the assets page does not get an empty, cached answer. */
export async function waitForNativeBalance(safe: SeededSafe): Promise<void> {
  const { env, path } = safe.context
  // CGW caches its first answer, so wait for the indexer before CGW is asked.
  await waitUntil(
    env,
    `${env.SAFE_TXS_BASE_URL}/v1/safes/${safe.address}/balances/?trusted=false`,
    (balances: TxsBalance[]) => balances.some((item) => item.tokenAddress === null && BigInt(item.balance) > 0n),
  )
  await waitUntil(env, `${path}/balances/usd?trusted=true&exclude_spam=true`, (balances: CgwBalances) =>
    balances.items.some((item) => item.tokenInfo.type === 'NATIVE_TOKEN' && BigInt(item.balance) > 0n),
  )
}
