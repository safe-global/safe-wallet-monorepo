/**
 * A Workspace on a Business plan, for journeys behind the Safe Pro gate. The billing mock gives a new subscription
 * the Business plan, which grants the `policies` entitlement.
 */
import type { Page } from '@playwright/test'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { CHAIN_IDS } from '../data/constants'
import {
  createWorkspace,
  type EmailSession,
  gatewayRequest,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
} from '../fixtures/email-session'
import type { SeededSafe } from './safe'

export type BusinessWorkspace = { id: string; session: EmailSession }

/** Signs the page in by email and creates a Workspace that holds the named Safes. */
export async function seedBusinessWorkspace(page: Page, safes: Record<string, SeededSafe>): Promise<BusinessWorkspace> {
  const session = await signInWithEmail(page, uniqueEmail('business-workspace'))
  const { uuid } = await createWorkspace(session, 'Business workspace')
  const entries = Object.entries(safes)
  await gatewayRequest(session, 'POST', `/v1/spaces/${uuid}/safes`, {
    safes: entries.map(([, { address }]) => ({ chainId: CHAIN_IDS.sepolia, address })),
    addressBookItems: entries.map(([name, { address }]) => ({ name, address, chainIds: [CHAIN_IDS.sepolia] })),
  })
  await storeSubscription(session, uuid)
  await waitForOverviews(entries.map(([, safe]) => safe))
  return { id: uuid, session }
}

/** The dashboard reads the CGW overview once; right after seeding it can still leave out a Safe it fails to load. */
async function waitForOverviews(safes: SeededSafe[]): Promise<void> {
  const { env } = safes[0].context
  const ids = safes.map(({ address }) => `${CHAIN_IDS.sepolia}:${address}`).join(',')
  await waitUntil(
    env,
    // Same variant as the dashboard request: CGW caches each query string on its own
    `${env.SAFE_CGW_BASE_URL}/v2/safes?currency=usd&safes=${encodeURIComponent(ids)}&trusted=false`,
    (overviews: SafeOverview[]) =>
      safes.every(({ address }) =>
        overviews.some((overview) => overview.address.value.toLowerCase() === address.toLowerCase()),
      ),
  )
}
