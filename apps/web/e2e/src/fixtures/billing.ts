/**
 * Checks of the billing flows of a Workspace; the local billing service opens a local page in place of Stripe's checkout.
 */
import type { Page } from '@playwright/test'
import { expect } from './test.fixture'

/** The local checkout page, opened for the Workspace (as the billing service names it, without dashes). */
export async function expectLocalCheckout(page: Page, workspaceId: string, plan: string): Promise<void> {
  await expect(page).toHaveURL(/\/billing\/checkout\/cs_e2e_\d+$/)
  await expect(page.getByRole('heading', { name: 'Local checkout' })).toBeVisible()
  await expect(page.getByText(`Plan: ${plan}`)).toBeVisible()
  await expect(page.getByText(`Workspace: ${workspaceId.replaceAll('-', '')}`)).toBeVisible()
}
