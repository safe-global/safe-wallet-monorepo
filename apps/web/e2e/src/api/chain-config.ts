import type { Page } from '@playwright/test'
import type { Chain, Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

type GasPaymentOption = Relayer['gasPaymentOptions'][number]

const CHAINS_ENDPOINT = /\/v[12]\/chains(\/\d+)?(\?.*)?$/

const isChainsPage = (body: unknown): body is { results: Chain[] } =>
  typeof body === 'object' && body !== null && 'results' in body && Array.isArray(body.results)

/** Rewrites every chain config that the wallet in `page` reads; the gateway keeps its own config. */
async function rewriteChains(page: Page, rewrite: (chain: Chain) => Chain): Promise<void> {
  await page.route(CHAINS_ENDPOINT, async (route) => {
    const response = await route.fetch()
    const body: unknown = await response.json()
    const json = isChainsPage(body) ? { ...body, results: body.results.map(rewrite) } : rewrite(body as Chain)
    await route.fulfill({ response, json })
  })
}

/** Makes the relayer of every chain offer only `options` to the wallet in `page`. */
export async function offerGasPaymentOptions(page: Page, options: GasPaymentOption[]): Promise<void> {
  await rewriteChains(page, (chain) =>
    chain.relayer ? { ...chain, relayer: { ...chain.relayer, gasPaymentOptions: options } } : chain,
  )
}
