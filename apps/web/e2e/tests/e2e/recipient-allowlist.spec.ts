import { Wallet, parseUnits } from 'ethers'
import {
  RECIPIENT_PERMISSION,
  mineBlockAt,
  readConfigurationRequest,
  readGuardSlots,
  readRecipientPermission,
} from '../../src/chain/policy-guard'
import { test, expect } from '../../src/fixtures/journey.fixture'
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
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance, waitForNativeBalance } from '../../src/seed/tokens'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const SAFE_NAME = 'Treasury'
const USDC_BALANCE = '10'

// Every run keeps its video, the evidence of the whole setup and apply flow for reviewers.
test.use({ video: 'on' })

// Safe Shield trusts a Safe in the user's Workspace, so no review asks to confirm a risk.
test.describe('Recipient allowlist policy', { tag: '@e2e' }, () => {
  test('should enforce the allowlist on the Safe when an owner sets it up', async ({ safePage, journey }) => {
    const { env } = journey
    const recipient = { name: 'Payroll', address: Wallet.createRandom().address }
    await installPolicyEngine(env)
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1, safeVersion: '1.5.0' })
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(USDC_BALANCE, SEPOLIA_USDC.decimals) })
    await waitForNativeBalance(safe)
    const { id: workspaceId } = await seedBusinessWorkspace(
      safePage,
      { [SAFE_NAME]: safe },
      { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] },
    )

    const policies = new PoliciesPage(safePage)
    const allowlist = new RecipientAllowlistPage(safePage)
    const review = new TxReviewPage(safePage)
    await policies.goto(workspaceId)
    await allowlist.startFromCatalogue()
    await allowlist.selectSafe(SAFE_NAME)
    // The native transfer policy the wallet names is not one the indexer serves, so the allowlist covers USDC only.
    await allowlist.excludeToken('ETH')
    await expect(allowlist.allowChip(SEPOLIA_USDC.symbol)).toHaveAttribute('aria-pressed', 'true')
    await allowlist.addRecipient(recipient)
    await allowlist.nextButton.click()

    await expect(allowlist.setupCalls).toHaveText([/configureImmediately/, /setGuard/, /setModuleGuard/])
    await review.signAndExecute({ confirmRisk: false })

    await expect
      .poll(() => readGuardSlots(env, safe.address))
      .toEqual({ transactionGuard: POLICY_GUARD, moduleGuard: POLICY_GUARD })
    const permission = await readRecipientPermission(env, {
      policy: ERC20_TRANSFER_POLICY,
      guard: POLICY_GUARD,
      safe: safe.address,
      token: SEPOLIA_USDC.address,
      recipient: recipient.address,
    })
    expect(permission).toBe(RECIPIENT_PERMISSION.ALWAYS)

    await registerAllowlist(safe, { allowlist: { token: SEPOLIA_USDC.address, recipients: [recipient.address] } })
    await policies.goto(workspaceId)
    await expect(allowlist.row(safe.address)).toContainText('1 recipient')
    await allowlist.openPanel(safe.address)
    await expect(allowlist.panel).toContainText('1 recipient')
    await expect(allowlist.panel.getByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  test('should apply a changed allowlist after the delay when an owner requests and then applies it', async ({
    safePage,
    journey,
  }) => {
    const { env } = journey
    const current = { name: 'Payroll', address: Wallet.createRandom().address }
    const added = { name: 'Exchange', address: Wallet.createRandom().address }
    const changed = { token: SEPOLIA_USDC.address, recipients: [current.address, added.address] }
    await installPolicyEngine(env)
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1, safeVersion: '1.5.0' })
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: parseUnits(USDC_BALANCE, SEPOLIA_USDC.decimals) })
    await waitForNativeBalance(safe)
    await seedAllowlist(safe, { token: SEPOLIA_USDC.address, recipients: [current.address] })
    const { id: workspaceId } = await seedBusinessWorkspace(
      safePage,
      { [SAFE_NAME]: safe },
      { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] },
    )

    const policies = new PoliciesPage(safePage)
    const allowlist = new RecipientAllowlistPage(safePage)
    const review = new TxReviewPage(safePage)
    await policies.goto(workspaceId)
    await expect(allowlist.row(safe.address)).toContainText('1 recipient')

    // The panel's Edit is not wired yet, so the change starts from Add policy, as the guard is already set.
    await allowlist.startFromAddPolicy()
    await allowlist.selectSafe(SAFE_NAME)
    await allowlist.excludeToken('ETH')
    await expect(allowlist.allowChip(SEPOLIA_USDC.symbol)).toHaveAttribute('aria-pressed', 'true')
    await allowlist.addRecipient(current)
    await allowlist.addRecipient(added)
    await allowlist.nextButton.click()

    await expect(allowlist.setupCalls).toHaveText([/requestConfiguration/])
    await review.signAndExecute({ confirmRisk: false })

    const request = { guard: POLICY_GUARD, safe: safe.address, root: configurationRootOf(changed) }
    await expect.poll(() => readConfigurationRequest(env, request)).toBeGreaterThan(0)
    const readyAt = await readConfigurationRequest(env, request)
    await registerAllowlist(safe, {
      allowlist: { token: SEPOLIA_USDC.address, recipients: [current.address] },
      roots: [{ root: request.root, readyAt, status: 'PENDING' }],
    })

    await policies.goto(workspaceId)
    await allowlist.openPanel(safe.address)
    await expect(allowlist.disabledPanelAction).toBeVisible()
    await expect(allowlist.reviewTransactionButton).toHaveCount(0)

    await mineBlockAt(env, readyAt)
    // Fakes the browser clock from here on; the panel reads the time when it renders, so it is opened again.
    await safePage.clock.setSystemTime(new Date((readyAt + 1) * 1000))
    await allowlist.closePanel()
    await allowlist.openPanel(safe.address)
    await expect(allowlist.reviewTransactionButton).toBeEnabled()
    await expect(allowlist.disabledPanelAction).toHaveCount(0)

    await allowlist.reviewTransactionButton.click()
    await review.signAndExecute({ confirmRisk: false })

    await expect.poll(() => readConfigurationRequest(env, request)).toBe(0)
    const permission = await readRecipientPermission(env, {
      policy: ERC20_TRANSFER_POLICY,
      guard: POLICY_GUARD,
      safe: safe.address,
      token: SEPOLIA_USDC.address,
      recipient: added.address,
    })
    expect(permission).toBe(RECIPIENT_PERMISSION.ALWAYS)

    await registerAllowlist(safe, { allowlist: changed, roots: [{ root: request.root, readyAt, status: 'APPLIED' }] })
    await policies.goto(workspaceId)
    await expect(allowlist.row(safe.address)).toContainText('2 recipients')
    await allowlist.openPanel(safe.address)
    await expect(allowlist.panel).toContainText('2 recipients')
  })
})
