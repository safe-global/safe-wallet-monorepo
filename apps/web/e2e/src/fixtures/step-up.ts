/**
 * The wallet side of a step-up: the wallet asks for a verification in a dialog, the user answers the local Auth0 in
 * a popup, and the wallet sends the rejected request again on the same page.
 */
import { expect, type Page } from '@playwright/test'
import { Auth0Page } from '../pages/auth0.page'

const PAGE_MARKER = '__stepUpPageMarker'

export const stepUpDialog = (page: Page) => page.getByTestId('step-up-dialog')

// Next.js renders its route announcer with role="alert" too.
export const toast = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text })

/** Marks the page, so a later check can tell that the step-up did not load the page again. */
async function markPage(page: Page): Promise<void> {
  await page.evaluate((marker) => Object.assign(window, { [marker]: true }), PAGE_MARKER)
}

/** Clicks Next in the dialog that the last action opened, and returns the popup. */
export async function clickVerify(page: Page): Promise<Page> {
  await expect(stepUpDialog(page)).toBeVisible()
  await markPage(page)
  const popup = page.waitForEvent('popup')
  await page.getByTestId('step-up-verify-button').click()
  return popup
}

/** Opens the popup from the dialog that the last action opened, and returns its Auth0 page. */
export async function openStepUpPopup(page: Page): Promise<Auth0Page> {
  const auth0 = new Auth0Page(await clickVerify(page))
  await expect(auth0.stepUpHeading).toBeVisible()
  return auth0
}

/** Answers the step-up that the last action started, with the code and a reported second factor. */
export async function completeStepUp(page: Page): Promise<void> {
  const auth0 = await openStepUpPopup(page)
  await auth0.verify()
}

/** The dialog is closed, and the user is on the same page that started the step-up, without a reload. */
export async function expectSamePage(page: Page): Promise<void> {
  await expect(stepUpDialog(page)).toBeHidden()
  expect(await page.evaluate((marker) => marker in window, PAGE_MARKER)).toBe(true)
}

/** The action completed on the page that started it, which then showed `confirmation` and went to `url`. */
export async function expectActionCompleted(page: Page, url: RegExp, confirmation?: string): Promise<void> {
  await expectSamePage(page)
  await expect(page).toHaveURL(url)
  if (confirmation) await expect(toast(page, confirmation)).toBeVisible()
}
