import { Wallet, ZeroHash } from 'ethers'
import { short } from '../../environment/scenarios/chain.mjs'
import { readDelayModifier, readSafeSetup } from '../../src/chain/recovery'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { DAY_IN_SECONDS, seedExecutableRecovery, seedProposedRecovery, seedRecovery } from '../../src/seed/recovery'
import { seedSafe } from '../../src/seed/safe'
import { RecoveryPage } from '../../src/pages/recovery.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const sorted = (addresses: string[]): string[] => [...addresses].sort()

test.describe('Account recovery', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should enable a Delay modifier with the recoverer when an owner sets up recovery', async ({
    safePage,
    journey,
  }, testInfo) => {
    const recoverer = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 1 })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    const review = new TxReviewPage(safePage)
    await recovery.gotoSettings(safe.prefixedAddress)
    await recovery.setUp({ recoverer, delay: '2 days' })
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await readSafeSetup(journey.env, safe.address)).modules).toHaveLength(1)
    const [delayModifier] = (await readSafeSetup(journey.env, safe.address)).modules
    expect(await readDelayModifier(journey.env, delayModifier)).toMatchObject({
      recoverers: [recoverer],
      cooldownSeconds: 2 * DAY_IN_SECONDS,
    })

    await recovery.gotoSettings(safe.prefixedAddress)
    await expect(recovery.recoverers).toContainText(short(recoverer))
  })

  test('should disable the Delay modifier on the Safe when an owner removes the recovery', async ({
    safePage,
    journey,
  }, testInfo) => {
    const safe = await seedSafe(journey, { threshold: 1 })
    const { delayModifier } = await seedRecovery(safe, {
      recoverer: Wallet.createRandom().address,
      cooldownSeconds: 2 * DAY_IN_SECONDS,
    })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    const review = new TxReviewPage(safePage)
    await recovery.gotoSettings(safe.prefixedAddress)
    await recovery.remove()
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await readSafeSetup(journey.env, safe.address)).modules).not.toContain(delayModifier)

    await recovery.gotoSettings(safe.prefixedAddress)
    await expect(recovery.setupButton).toBeVisible()
    await expect(recovery.recoverers).toBeHidden()
  })

  test('should set the new cooldown on the Delay modifier when an owner changes the review window', async ({
    safePage,
    journey,
  }, testInfo) => {
    const safe = await seedSafe(journey, { threshold: 1 })
    const { delayModifier } = await seedRecovery(safe, {
      recoverer: Wallet.createRandom().address,
      cooldownSeconds: 2 * DAY_IN_SECONDS,
    })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    const review = new TxReviewPage(safePage)
    await recovery.gotoSettings(safe.prefixedAddress)
    await recovery.changeDelay('7 days')
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect
      .poll(async () => (await readDelayModifier(journey.env, delayModifier)).cooldownSeconds)
      .toBe(7 * DAY_IN_SECONDS)

    await recovery.gotoSettings(safe.prefixedAddress)
    await expect(recovery.recoverers).toContainText('7 days')
  })

  test('should queue a proposal in the Delay modifier when the recoverer starts a recovery', async ({
    safePage,
    journey,
  }, testInfo) => {
    const newOwner = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 1 })
    const { delayModifier } = await seedRecovery(safe, {
      recoverer: journey.owners.owner4.address,
      cooldownSeconds: 2 * DAY_IN_SECONDS,
    })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await recovery.proposeRecovery(newOwner)

    await expect
      .poll(() => readDelayModifier(journey.env, delayModifier))
      .toMatchObject({ txNonce: 0, queueNonce: 1, nextProposalHash: expect.not.stringMatching(ZeroHash) })

    await recovery.openActionRequiredPanel()
    await expect(recovery.inProgressCard).toBeVisible()
    await expect(recovery.inProgressCard).toContainText('Account recovery in progress')
    // Anvil can stamp blocks a few seconds ahead of the browser clock, so the 2-day cooldown can still read 2 days
    await expect(recovery.inProgressCard).toContainText(/1 day|2 days/)
  })

  test('should skip the queued recovery when an owner cancels it', async ({ safePage, journey }, testInfo) => {
    const { owner1, owner2, owner3, owner4 } = journey.owners
    const safe = await seedSafe(journey, { threshold: 1 })
    const seeded = await seedRecovery(safe, { recoverer: owner2.address, cooldownSeconds: 2 * DAY_IN_SECONDS })
    await seedProposedRecovery(seeded, {
      recoverer: owner2,
      swap: { oldOwner: owner1.address, newOwner: owner3.address },
    })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    const review = new TxReviewPage(safePage)
    await safePage.goto(`${ROUTES.transactionsQueue}?safe=${safe.prefixedAddress}`)
    await recovery.goToQueue()
    await recovery.cancel()
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect
      .poll(() => readDelayModifier(journey.env, seeded.delayModifier))
      .toMatchObject({ txNonce: 1, queueNonce: 1 })
    expect(sorted((await readSafeSetup(journey.env, safe.address)).owners)).toEqual(
      sorted([owner4.address, owner1.address]),
    )

    await safePage.goto(`${ROUTES.transactionsQueue}?safe=${safe.prefixedAddress}`)
    await expect(recovery.queuedRecoveries).toHaveCount(0)
  })

  test('should give the Safe its new owners when a recovery runs after its review window', async ({
    safePage,
    journey,
  }, testInfo) => {
    const { owner1, owner2, owner3, owner4 } = journey.owners
    const safe = await seedSafe(journey, { threshold: 1 })
    const seeded = await seedRecovery(safe, { recoverer: owner2.address, cooldownSeconds: 1 })
    await seedExecutableRecovery(seeded, {
      recoverer: owner2,
      swap: { oldOwner: owner1.address, newOwner: owner3.address },
    })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const recovery = new RecoveryPage(safePage)
    await safePage.goto(`${ROUTES.transactionsQueue}?safe=${safe.prefixedAddress}`)
    await recovery.goToQueue()
    await recovery.execute()

    await expect
      .poll(async () => sorted((await readSafeSetup(journey.env, safe.address)).owners))
      .toEqual(sorted([owner4.address, owner3.address]))

    await recovery.gotoOwners(safe.prefixedAddress)
    await expect(safePage.getByTestId('signer-list')).toContainText(owner3.address)
  })
})
