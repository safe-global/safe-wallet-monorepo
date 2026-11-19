import type { Page, Request } from '@playwright/test'
import type { DeclaredAttribution } from '@safe-global/utils/utils/declaredAttribution'

const isProposalOf = (safeAddress: string) => (request: Request) =>
  request.method() === 'POST' &&
  new URL(request.url()).pathname.toLowerCase().endsWith(`/transactions/${safeAddress.toLowerCase()}/propose`)

/** Call before the action that proposes; resolves with the `declared` of the next proposal for `safeAddress` */
export async function nextDeclaredAttribution(
  page: Page,
  safeAddress: string,
): Promise<DeclaredAttribution | undefined> {
  const request = await page.waitForRequest(isProposalOf(safeAddress))
  return (request.postDataJSON() as { declared?: DeclaredAttribution }).declared
}
