import type { Page } from '@playwright/test'
import type { Chain, Relayer } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

type GasPaymentOption = Relayer['gasPaymentOptions'][number]

const CHAINS_ENDPOINT = /\/v[12]\/chains(\/\d+)?(\?.*)?$/

const isChainsPage = (body: unknown): body is { results: Chain[] } =>
  typeof body === 'object' && body !== null && 'results' in body && Array.isArray(body.results)

/**
 * Makes the relayer of every chain offer only `options` to the wallet in `page`, from its next page load. The stack
 * has one chain config, with every option; production lists `PAY_FROM_SAFE` on no chain and has no relayer on most.
 * The gateway and the relay keep the config of the stack, so an option left in `options` still relays.
 */
export async function offerGasPaymentOptions(page: Page, options: GasPaymentOption[]): Promise<void> {
  const withOptions = (chain: Chain): Chain =>
    chain.relayer ? { ...chain, relayer: { ...chain.relayer, gasPaymentOptions: options } } : chain

  await page.route(CHAINS_ENDPOINT, async (route) => {
    const response = await route.fetch()
    const body: unknown = await response.json()
    const json = isChainsPage(body) ? { ...body, results: body.results.map(withOptions) } : withOptions(body as Chain)
    await route.fulfill({ response, json })
  })
}
