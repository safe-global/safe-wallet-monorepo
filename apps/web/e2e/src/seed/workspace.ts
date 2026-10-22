/**
 * A Workspace on a Business plan, for journeys behind the Safe Pro gate. The billing mock gives a new subscription
 * the Business plan, which grants the `policies` entitlement.
 */
import type { Page } from '@playwright/test'
import { CHAIN_IDS } from '../data/constants'
import {
  createWorkspace,
  gatewayRequest,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
} from '../fixtures/email-session'
import type { SeededSafe } from './safe'

/** Signs the page in by email and creates a Workspace that holds the named Safes; returns the Workspace id. */
export async function seedBusinessWorkspace(page: Page, safes: Record<string, SeededSafe>): Promise<string> {
  const session = await signInWithEmail(page, uniqueEmail('business-workspace'))
  const { uuid } = await createWorkspace(session, 'Business workspace')
  const entries = Object.entries(safes)
  await gatewayRequest(session, 'POST', `/v1/spaces/${uuid}/safes`, {
    safes: entries.map(([, { address }]) => ({ chainId: CHAIN_IDS.sepolia, address })),
    addressBookItems: entries.map(([name, { address }]) => ({ name, address, chainIds: [CHAIN_IDS.sepolia] })),
  })
  await storeSubscription(uuid)
  return uuid
}
