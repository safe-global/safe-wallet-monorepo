/**
 * The wallet side of a step-up: the user answers the local Auth0, and the wallet replays the action on return.
 */
import { expect, type Page } from '@playwright/test'
import { Auth0Page } from '../pages/auth0.page'
import { launchScreen } from './email-session'

// Next.js renders its route announcer with role="alert" too.
export const toast = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text })

/** Answers the step-up that the last action started, with the code and a reported second factor. */
export async function completeStepUp(page: Page): Promise<void> {
  const auth0 = new Auth0Page(page)
  await expect(auth0.stepUpHeading).toBeVisible()
  await auth0.verify()
}

/** The user is back on `url` with the confirmation of the replayed action, and the app has finished loading. */
export async function expectActionReplayed(page: Page, url: RegExp, confirmation: string): Promise<void> {
  await expect(page).toHaveURL(url)
  await expect(toast(page, confirmation)).toBeVisible()
  await expect(launchScreen(page)).toBeHidden()
}
