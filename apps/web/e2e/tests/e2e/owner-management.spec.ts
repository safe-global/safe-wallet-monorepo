import { Wallet } from 'ethers'
import { readSafeSetup } from '../../src/chain/recovery'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { OwnersPage } from '../../src/pages/owners.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

type OwnerSetup = { owners: string[]; threshold: number }

const sorted = (addresses: string[]): string[] => [...addresses].sort()

async function ownerSetupInCgw(safeApiClient: SafeApiClient, safeAddress: string): Promise<OwnerSetup> {
  const { owners, threshold } = await safeApiClient.getSafeInfo(safeAddress)
  return { owners: sorted(owners.map((owner) => owner.value)), threshold }
}

test.describe('Owner management', { tag: '@e2e' }, () => {
  test('should add the signer and require two confirmations when an owner adds a signer with threshold 2', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { owner4 } = journey.owners
    const newSigner = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const owners = new OwnersPage(safePage)
    const review = new TxReviewPage(safePage)
    await owners.goto(safe.prefixedAddress)
    await owners.addSigner({ newSigner, threshold: 2 })
    await review.signAndExecute()

    const expected = { owners: sorted([owner4.address, newSigner]), threshold: 2 }
    await expect.poll(() => ownerSetupInCgw(safeApiClient, safe.address)).toEqual(expected)
    const onChain = await readSafeSetup(journey.env, safe.address)
    expect({ owners: sorted(onChain.owners), threshold: onChain.threshold }).toEqual(expected)

    await owners.goto(safe.prefixedAddress)
    await expect(owners.signerList).toContainText(newSigner)
    await expect(owners.requiredConfirmations).toHaveText('2 out of 2 signers.')
  })

  test('should swap the signer for the new address when an owner replaces a signer', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { owner4, owner1 } = journey.owners
    const newSigner = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })

    const owners = new OwnersPage(safePage)
    const review = new TxReviewPage(safePage)
    await owners.goto(safe.prefixedAddress)
    await owners.replaceSigner({ oldSigner: owner1.address, newSigner })
    await review.signAndExecute()

    const expected = { owners: sorted([owner4.address, newSigner]), threshold: 1 }
    await expect.poll(() => ownerSetupInCgw(safeApiClient, safe.address)).toEqual(expected)
    const onChain = await readSafeSetup(journey.env, safe.address)
    expect({ owners: sorted(onChain.owners), threshold: onChain.threshold }).toEqual(expected)

    await owners.goto(safe.prefixedAddress)
    await expect(owners.signerList).toContainText(newSigner)
    await expect(owners.signerList).not.toContainText(owner1.address)
    await expect(owners.requiredConfirmations).toHaveText('1 out of 2 signers.')
  })

  test('should leave the Safe with one signer when an owner removes the other signer', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { owner4, owner1 } = journey.owners
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })

    const owners = new OwnersPage(safePage)
    const review = new TxReviewPage(safePage)
    await owners.goto(safe.prefixedAddress)
    await owners.removeSigner(owner1.address)
    await review.signAndExecute()

    const expected = { owners: [owner4.address], threshold: 1 }
    await expect.poll(() => ownerSetupInCgw(safeApiClient, safe.address)).toEqual(expected)
    const onChain = await readSafeSetup(journey.env, safe.address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual(expected)

    await owners.goto(safe.prefixedAddress)
    await expect(owners.signerList).not.toContainText(owner1.address)
    await expect(owners.requiredConfirmations).toHaveText('1 out of 1 signer.')
  })
})
