import { Interface, ZeroAddress, ZeroHash, parseEther } from 'ethers'
import type { Page } from '@playwright/test'
import { LIFI_DIAMOND_ADDRESS } from '../../environment/infra/mocks/lifi-constants'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SafeShieldPage } from '../../src/pages/safe-shield.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { seedQueuedCall, seedSafe, seedSafeWithOtherSetupOn, type SeededSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const POLYGON = 137
// Optimism is not in the stack's config service
const UNSUPPORTED_CHAIN = 10
const AMOUNT = parseEther('0.001')
// The descriptions of CGW's bridge checks (recipient-analysis.constants.ts)
const DIFFERENT_SETUP =
  'Your Safe exists on the target chain but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.'
const MISSING_OWNERSHIP =
  'This Safe account is not activated on the target chain. First, create the Safe, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.'
const UNSUPPORTED_NETWORK =
  'app.safe.global does not support the network. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.'

const lifiDiamond = new Interface([
  'function swapAndStartBridgeTokensViaAcrossV3((bytes32 transactionId, string bridge, string integrator, address referrer, address sendingAssetId, address receiver, uint256 minAmount, uint256 destinationChainId, bool hasSourceSwaps, bool hasDestinationCall) bridgeData, (address callTo, address approveTo, address sendingAssetId, address receivingAssetId, uint256 fromAmount, bytes callData, bool requiresDeposit)[] swapData, (address receiverAddress, address refundAddress, address receivingAssetId, uint256 outputAmount, uint64 outputAmountPercent, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes message) acrossData)',
])

// CGW maps a LiFi call as a bridge only when it has source swaps (LiFiDecoder.isSwapAndBridge)
function bridgeEthToItself(safe: SeededSafe, destinationChainId: number): string {
  return lifiDiamond.encodeFunctionData('swapAndStartBridgeTokensViaAcrossV3', [
    {
      transactionId: ZeroHash,
      bridge: 'across',
      integrator: 'safe-e2e',
      referrer: ZeroAddress,
      sendingAssetId: ZeroAddress,
      receiver: safe.address,
      minAmount: AMOUNT,
      destinationChainId,
      hasSourceSwaps: true,
      hasDestinationCall: false,
    },
    [],
    {
      receiverAddress: safe.address,
      refundAddress: safe.address,
      receivingAssetId: ZeroAddress,
      outputAmount: AMOUNT,
      outputAmountPercent: 0,
      exclusiveRelayer: ZeroAddress,
      quoteTimestamp: 0,
      fillDeadline: 0,
      exclusivityDeadline: 0,
      message: '0x',
    },
  ])
}

/** Queue a LiFi bridge of the Safe's ETH to its own address on `destinationChainId` and open its execution review */
async function reviewBridge(page: Page, safe: SeededSafe, destinationChainId: number): Promise<SafeShieldPage> {
  const { id: workspaceId } = await seedBusinessWorkspace(page, { Treasury: safe })
  await seedQueuedCall(safe, { nonce: 0, to: LIFI_DIAMOND_ADDRESS, data: bridgeEthToItself(safe, destinationChainId) })
  const queue = new TxQueuePage(page)
  await queue.goto(safe.prefixedAddress, workspaceId)
  await queue.execute(0)
  const safeShield = new SafeShieldPage(page)
  await safeShield.expandRecipientCard()
  return safeShield
}

// The stack's LiFi mock (environment/infra/mocks/lifi-api.ts) makes CGW read calls to LIFI_DIAMOND_ADDRESS as bridges.
test.describe('Safe Shield bridge check', { tag: '@e2e' }, () => {
  test('should warn of a different setup when the Safe has other owners on the target chain', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafeWithOtherSetupOn(journey, POLYGON)

    const safeShield = await reviewBridge(safePage, safe, POLYGON)

    await expect(safeShield.recipientFinding(DIFFERENT_SETUP)).toBeVisible()
  })

  test('should warn of missing ownership when the Safe does not exist on the target chain', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const safeShield = await reviewBridge(safePage, safe, POLYGON)

    await expect(safeShield.recipientFinding(MISSING_OWNERSHIP)).toBeVisible()
  })

  test('should warn of an unsupported network when the wallet does not support the target chain', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const safeShield = await reviewBridge(safePage, safe, UNSUPPORTED_CHAIN)

    await expect(safeShield.recipientFinding(UNSUPPORTED_NETWORK)).toBeVisible()
  })
})
