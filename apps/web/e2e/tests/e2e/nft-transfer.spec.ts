import type { Page } from '@playwright/test'
import type { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { multiSendActionCounts } from '../../src/api/transaction-items'
import { ownerOf } from '../../src/chain/nfts'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedNfts } from '../../src/seed/nfts'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'
import { NftsPage } from '../../src/pages/nfts.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const labelOf = (tokenId: string) => `CF #${tokenId}`

function tokenIdsIn(collectibles: CollectiblePage, contract: string): string[] {
  return collectibles.results.filter(({ address }) => address === contract).map(({ id }) => id)
}

async function sendNfts(
  page: Page,
  { sender, recipient, tokenIds }: { sender: SeededSafe; recipient: SeededSafe; tokenIds: string[] },
): Promise<void> {
  const nfts = new NftsPage(page)
  const review = new TxReviewPage(page)
  await nfts.goto(sender.prefixedAddress)
  await nfts.send({ labels: tokenIds.map(labelOf), recipient: recipient.address })
  await review.sign()
  await review.execute()
  await review.waitForExecution()
}

test.describe('Send NFTs', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safes on the isolated stack')

  test('should transfer the NFT to the recipient when an owner sends one NFT', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const [sender, recipient] = [await seedSafe(journey, { threshold: 1 }), await seedSafe(journey, { threshold: 1 })]
    const { contract, tokenIds } = await seedNfts(sender, { count: 2 })
    const [sent, kept] = tokenIds
    testInfo.annotations.push({ type: 'safe-address', description: sender.prefixedAddress })

    await sendNfts(safePage, { sender, recipient, tokenIds: [sent] })

    expect(await ownerOf(journey.env, { contract, tokenId: sent })).toBe(recipient.address)
    await expect
      .poll(async () => tokenIdsIn(await safeApiClient.getCollectibles(recipient.address), contract))
      .toEqual([sent])
    await expect
      .poll(async () => tokenIdsIn(await safeApiClient.getCollectibles(sender.address), contract))
      .toEqual([kept])

    const nfts = new NftsPage(safePage)
    await nfts.goto(recipient.prefixedAddress)
    await expect(nfts.nft(labelOf(sent))).toBeVisible()
  })

  test('should transfer both NFTs in one transaction when an owner sends two NFTs', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const [sender, recipient] = [await seedSafe(journey, { threshold: 1 }), await seedSafe(journey, { threshold: 1 })]
    const { contract, tokenIds } = await seedNfts(sender, { count: 2 })
    testInfo.annotations.push({ type: 'safe-address', description: sender.prefixedAddress })

    await sendNfts(safePage, { sender, recipient, tokenIds })

    for (const tokenId of tokenIds) {
      expect(await ownerOf(journey.env, { contract, tokenId })).toBe(recipient.address)
    }
    await expect
      .poll(async () => tokenIdsIn(await safeApiClient.getCollectibles(recipient.address), contract).sort())
      .toEqual(tokenIds)
    await expect
      .poll(async () => multiSendActionCounts(await safeApiClient.getTransactionHistory(sender.address)))
      .toEqual([tokenIds.length])

    const nfts = new NftsPage(safePage)
    await nfts.goto(recipient.prefixedAddress)
    await expect(nfts.rows).toHaveCount(tokenIds.length)
  })
})
