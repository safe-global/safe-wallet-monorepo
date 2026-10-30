import { type Page } from '@playwright/test'
import { Wallet, parseUnits } from 'ethers'
import { confirmationsOf } from '../../src/api/transaction-items'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import {
  RECIPIENT_PERMISSION,
  mineBlockAt,
  readConfigurationRequest,
  readGuardSlots,
  readRecipientPermission,
} from '../../src/chain/policy-guard'
import { test, expect, type Journey, type OwnerName } from '../../src/fixtures/journey.fixture'
import { PoliciesPage } from '../../src/pages/policies.page'
import { RecipientAllowlistPage } from '../../src/pages/recipient-allowlist.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import {
  ERC20_TRANSFER_POLICY,
  POLICY_GUARD,
  configurationRootOf,
  installPolicyEngine,
  registerAllowlist,
  seedAllowlist,
} from '../../src/seed/policy-guard'
import { type SeededSafe, seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance, waitForNativeBalance } from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const SAFE_NAME = 'Treasury'
const USDC_BALANCE = '10'
const SINGLE_OWNER: OwnerSetup = { owners: ['owner4'], threshold: 1 }
/** OWNER_4 starts every change and OWNER_1 confirms and executes it */
const TWO_OF_THREE: OwnerSetup = { owners: ['owner4', 'owner1', 'owner2'], threshold: 2 }

/** The calls each reviewed transaction lists, in execution order */
const SETUP_CALLS = [/configureImmediately/, /setGuard/, /setModuleGuard/]
const REQUEST_CALLS = [/requestConfiguration/]
const APPLY_CALLS = [/applyConfiguration/]

type OwnerSetup = { owners: OwnerName[]; threshold: number }
type Recipient = { name: string; address: string }

// Every run keeps its video, the evidence of the whole setup and apply flow for reviewers.
test.use({ video: 'on' })

const newRecipient = (name: string): Recipient => ({ name, address: Wallet.createRandom().address })

/**
 * A Safe 1.5.0 with 10 USDC and 1 ETH in a Business Workspace that opted into the allowlist; with `allowlisted`, it
 * already enforces an allowlist of USDC to those recipients.
 */
async function seedAllowlistSafe(
  page: Page,
  journey: Journey,
  { owners, threshold }: OwnerSetup,
  { allowlisted }: { allowlisted?: Recipient[] } = {},
): Promise<{ safe: SeededSafe; workspaceId: string }> {
  await installPolicyEngine(journey.env)
  const safe = await seedSafe(journey, { owners, threshold, safeVersion: '1.5.0' })
  await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(USDC_BALANCE, SEPOLIA_USDC.decimals) })
  await waitForNativeBalance(safe)
  if (allowlisted) {
    const allowlist = { token: SEPOLIA_USDC.address, recipients: allowlisted.map(({ address }) => address) }
    await seedAllowlist(journey, safe, allowlist, { cosigners: owners.slice(1, threshold) })
  }
  const { id } = await seedBusinessWorkspace(
    page,
    { [SAFE_NAME]: safe },
    { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] },
  )
  return { safe, workspaceId: id }
}

/** Picks the Safe in the open setup flow, allows USDC to `recipients`, continues to the review and confirms what it blocks */
async function fillAllowlist(allowlist: RecipientAllowlistPage, recipients: Recipient[]): Promise<void> {
  await allowlist.selectSafe(SAFE_NAME)
  // The native transfer policy the wallet names is not one the indexer serves, so the allowlist covers USDC only.
  await allowlist.excludeToken('ETH')
  await expect(allowlist.allowChip(SEPOLIA_USDC.symbol)).toHaveAttribute('aria-pressed', 'true')
  for (const recipient of recipients) await allowlist.addRecipient(recipient)
  await allowlist.nextButton.click()
  await allowlist.confirmBlockedActions()
}

/** The open review lists the transaction's calls, and its configuring call, the first, rule by rule */
async function expectReviewedCalls(allowlist: RecipientAllowlistPage, calls: RegExp[]): Promise<void> {
  await expect(allowlist.setupCalls).toHaveText(calls)
  await allowlist.setupCalls.first().click()
  await expect(allowlist.rules.first()).toContainText('Rule 1 of')
}

/**
 * Signs the reviewed transaction as the connected owner: on a 1/n Safe it executes at once; on a 2/n Safe the owner
 * only proposes it, and OWNER_1 confirms and executes it from the Policies table.
 */
async function signAndExecute(page: Page, context: SigningContext, calls: RegExp[]): Promise<void> {
  const { safeApiClient, safe, setup } = context
  const review = new TxReviewPage(page)
  // Safe Shield trusts a Safe in the user's Workspace, so no review asks to confirm a risk.
  if (setup.threshold === 1) {
    await review.signAndExecute({ confirmRisk: false })
    return
  }
  await review.sign({ confirmRisk: false })
  await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
  await confirmFromPoliciesAsSecondOwner(page, context, calls)
}

type SigningContext = {
  journey: Journey
  safeApiClient: SafeApiClient
  safe: SeededSafe
  setup: OwnerSetup
  workspaceId: string
}

/**
 * OWNER_1 finds the queued allowlist transaction in the Policies table; its panel opens the review, where they check
 * the decoded calls, then confirm and execute it.
 */
async function confirmFromPoliciesAsSecondOwner(
  page: Page,
  { journey, safe, workspaceId }: Pick<SigningContext, 'journey' | 'safe' | 'workspaceId'>,
  calls: RegExp[],
): Promise<void> {
  const allowlist = new RecipientAllowlistPage(page)
  await journey.connectAs('owner1')
  await new PoliciesPage(page).goto(workspaceId)
  await allowlist.openPendingPanel(safe.address)
  await expect(allowlist.panel).toContainText('1 of 2 signatures')
  await allowlist.reviewTransactionButton.click()
  await expectReviewedCalls(allowlist, calls)
  await new TxReviewPage(page).signAndExecute({ confirmRisk: false })
}

const permissionOf = (journey: Journey, safe: SeededSafe, recipient: Recipient) =>
  readRecipientPermission(journey.env, {
    policy: ERC20_TRANSFER_POLICY,
    guard: POLICY_GUARD,
    safe: safe.address,
    token: SEPOLIA_USDC.address,
    recipient: recipient.address,
  })

test.describe('Recipient allowlist policy', { tag: '@e2e' }, () => {
  for (const { setup, title } of [
    { setup: SINGLE_OWNER, title: 'should enforce the allowlist on the Safe when an owner sets it up' },
    {
      setup: TWO_OF_THREE,
      title: 'should enforce the allowlist on a 2-of-3 Safe when one owner sets it up and a second owner confirms it',
    },
  ]) {
    test(title, async ({ safePage, safeApiClient, journey }) => {
      const recipient = newRecipient('Payroll')
      const { safe, workspaceId } = await seedAllowlistSafe(safePage, journey, setup)

      const policies = new PoliciesPage(safePage)
      const allowlist = new RecipientAllowlistPage(safePage)
      await policies.goto(workspaceId)
      await allowlist.startFromCatalogue()
      await fillAllowlist(allowlist, [recipient])

      await expectReviewedCalls(allowlist, SETUP_CALLS)
      await signAndExecute(safePage, { journey, safeApiClient, safe, setup, workspaceId }, SETUP_CALLS)

      await expect
        .poll(() => readGuardSlots(journey.env, safe.address))
        .toEqual({ transactionGuard: POLICY_GUARD, moduleGuard: POLICY_GUARD })
      expect(await permissionOf(journey, safe, recipient)).toBe(RECIPIENT_PERMISSION.ALWAYS)

      await registerAllowlist(safe, { allowlist: { token: SEPOLIA_USDC.address, recipients: [recipient.address] } })
      // CGW can still serve the policies it cached before the setup was registered, so reload until it doesn't.
      await expect(async () => {
        await policies.goto(workspaceId)
        await expect(allowlist.row(safe.address)).toContainText('1 recipient', { timeout: 5_000 })
      }).toPass({ timeout: 90_000 })
      await allowlist.openPanel(safe.address)
      await expect(allowlist.panel).toContainText('1 recipient')
      await expect(allowlist.panel.getByRole('button', { name: 'Remove' })).toBeEnabled()
    })
  }

  for (const { setup, title } of [
    {
      setup: SINGLE_OWNER,
      title: 'should apply a changed allowlist after the delay when an owner requests and then applies it',
    },
    {
      setup: TWO_OF_THREE,
      title:
        'should apply a changed allowlist after the delay when two owners of a 2-of-3 Safe sign the request and the apply',
    },
  ]) {
    test(title, async ({ safePage, safeApiClient, journey }) => {
      const { env } = journey
      const current = newRecipient('Payroll')
      const added = newRecipient('Exchange')
      const changed = { token: SEPOLIA_USDC.address, recipients: [current.address, added.address] }
      const { safe, workspaceId } = await seedAllowlistSafe(safePage, journey, setup, { allowlisted: [current] })
      const signing = { journey, safeApiClient, safe, setup, workspaceId }

      const policies = new PoliciesPage(safePage)
      const allowlist = new RecipientAllowlistPage(safePage)
      await policies.goto(workspaceId)
      await expect(allowlist.row(safe.address)).toContainText('1 recipient')

      // The panel has no Edit, so the change starts from Add policy, as the guard is already set.
      await allowlist.startFromAddPolicy()
      await fillAllowlist(allowlist, [current, added])
      await expectReviewedCalls(allowlist, REQUEST_CALLS)
      await signAndExecute(safePage, signing, REQUEST_CALLS)

      const request = { guard: POLICY_GUARD, safe: safe.address, root: configurationRootOf(changed, safe.address) }
      await expect.poll(() => readConfigurationRequest(env, request)).toBeGreaterThan(0)
      const readyAt = await readConfigurationRequest(env, request)
      await registerAllowlist(safe, {
        allowlist: { token: SEPOLIA_USDC.address, recipients: [current.address] },
        roots: [{ root: request.root, readyAt, status: 'PENDING' }],
      })

      // The owner who started the change applies it.
      if (setup.threshold > 1) await journey.connectAs('owner4')
      // CGW can still serve the policies it cached before the request was registered, so reload until it doesn't.
      await expect(async () => {
        await policies.goto(workspaceId)
        await allowlist.openPendingPanel(safe.address)
        await expect(allowlist.disabledPanelAction).toBeVisible({ timeout: 5_000 })
      }).toPass({ timeout: 90_000 })
      await expect(allowlist.reviewTransactionButton).toHaveCount(0)

      await mineBlockAt(env, readyAt)
      // Fakes the browser clock from here on; the panel reads the time when it renders, so it is opened again.
      await safePage.clock.setSystemTime(new Date((readyAt + 1) * 1000))
      await allowlist.closePanel()
      await allowlist.openPendingPanel(safe.address)
      await expect(allowlist.reviewTransactionButton).toBeEnabled()
      await expect(allowlist.disabledPanelAction).toHaveCount(0)

      await allowlist.reviewTransactionButton.click()
      await expectReviewedCalls(allowlist, APPLY_CALLS)
      if (setup.threshold === 1) {
        await new TxReviewPage(safePage).signAndExecute({ confirmRisk: false })
      } else {
        await new TxReviewPage(safePage).sign({ confirmRisk: false })
        await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
        // The queued apply is a row of its own until it executes, with the signatures it still needs.
        await confirmFromPoliciesAsSecondOwner(safePage, signing, APPLY_CALLS)
      }

      await expect.poll(() => readConfigurationRequest(env, request)).toBe(0)
      expect(await permissionOf(journey, safe, added)).toBe(RECIPIENT_PERMISSION.ALWAYS)

      await registerAllowlist(safe, { allowlist: changed, roots: [{ root: request.root, readyAt, status: 'APPLIED' }] })
      // The applied request keeps its own row until CGW drops what it cached, so reload until only the allowlist is left.
      await expect(async () => {
        await policies.goto(workspaceId)
        await expect(allowlist.row(safe.address)).toHaveCount(1, { timeout: 5_000 })
        await expect(allowlist.row(safe.address)).toContainText('2 recipients', { timeout: 5_000 })
      }).toPass({ timeout: 90_000 })
      await allowlist.openPanel(safe.address)
      await expect(allowlist.panel).toContainText('2 recipients')
    })
  }
})
