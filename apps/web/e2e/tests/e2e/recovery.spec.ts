import { Wallet } from 'ethers'
import { short } from '../../environment/scenarios/chain.mjs'
import { readDelayModifier, readSafeSetup } from '../../src/chain/recovery'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { DAY_IN_SECONDS, seedRecovery } from '../../src/seed/recovery'
import { seedSafe } from '../../src/seed/safe'
import { RecoveryPage } from '../../src/pages/recovery.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

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
})
