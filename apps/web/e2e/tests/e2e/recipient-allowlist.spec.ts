import { type Page } from '@playwright/test'
import { Wallet, parseUnits } from 'ethers'
import { RECIPIENT_PERMISSION, readGuardSlots, readRecipientPermission } from '../../src/chain/policy-guard'
import { test, expect, type Journey } from '../../src/fixtures/journey.fixture'
import { PoliciesPage } from '../../src/pages/policies.page'
import { RecipientAllowlistPage } from '../../src/pages/recipient-allowlist.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import {
  ERC20_TRANSFER_POLICY,
  POLICY_GUARD,
  installPolicyEngine,
  registerAllowlist,
} from '../../src/seed/policy-guard'
import { type SeededSafe, seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance, waitForNativeBalance } from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const SAFE_NAME = 'Treasury'
const USDC_BALANCE = '10'

/** The calls the setup review lists, in execution order */
const SETUP_CALLS = [/configureImmediately/, /setGuard/, /setModuleGuard/, /setFallbackHandler/]

type Recipient = { name: string; address: string }

// Every run keeps its video, the evidence of the whole setup flow for reviewers.
test.use({ video: 'on' })

const newRecipient = (name: string): Recipient => ({ name, address: Wallet.createRandom().address })

/** A Safe 1.5.0 owned by Alice alone, with 10 USDC and 1 ETH, in a Business Workspace */
async function seedAllowlistSafe(page: Page, journey: Journey): Promise<{ safe: SeededSafe; workspaceId: string }> {
  await installPolicyEngine(journey.env)
  const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1, safeVersion: '1.5.0' })
  await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(USDC_BALANCE, SEPOLIA_USDC.decimals) })
  await waitForNativeBalance(safe)
  const { id } = await seedBusinessWorkspace(page, { [SAFE_NAME]: safe })
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

/** Reloads until CGW serves the registered allowlist; it can serve its cached policy state for a short while */
async function expectServedRow(page: Page, workspaceId: string, safe: SeededSafe, text: string): Promise<void> {
  const policies = new PoliciesPage(page)
  const allowlist = new RecipientAllowlistPage(page)
  await expect(async () => {
    await policies.goto(workspaceId)
    await expect(allowlist.row(safe.address)).toContainText(text, { timeout: 5_000 })
  }).toPass({ timeout: 90_000 })
}

const permissionOf = (journey: Journey, safe: SeededSafe, recipient: Recipient) =>
  readRecipientPermission(journey.env, {
    policy: ERC20_TRANSFER_POLICY,
    guard: POLICY_GUARD,
    safe: safe.address,
    token: SEPOLIA_USDC.address,
    recipient: recipient.address,
  })

test.describe('Recipient allowlist setup', { tag: '@e2e' }, () => {
  test('should enforce the allowlist on the Safe when an owner sets it up', async ({ safePage, journey }) => {
    const recipient = newRecipient('Payroll')
    const { safe, workspaceId } = await seedAllowlistSafe(safePage, journey)

    const policies = new PoliciesPage(safePage)
    const allowlist = new RecipientAllowlistPage(safePage)
    await policies.goto(workspaceId)
    await allowlist.startFromCatalogue()
    await fillAllowlist(allowlist, [recipient])

    await expectReviewedCalls(allowlist, SETUP_CALLS)
    await new TxReviewPage(safePage).signAndExecute()

    await expect
      .poll(() => readGuardSlots(journey.env, safe.address))
      .toEqual({ transactionGuard: POLICY_GUARD, moduleGuard: POLICY_GUARD })
    expect(await permissionOf(journey, safe, recipient)).toBe(RECIPIENT_PERMISSION.ALWAYS)

    await registerAllowlist(safe, { allowlist: { token: SEPOLIA_USDC.address, recipients: [recipient.address] } })
    await expectServedRow(safePage, workspaceId, safe, '1 recipient')
    await allowlist.openPanel(safe.address)
    await expect(allowlist.panel).toContainText('1 recipient')
  })
})
