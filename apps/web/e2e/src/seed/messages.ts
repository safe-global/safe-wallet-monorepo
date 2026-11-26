import { hashSafeMessage } from '@safe-global/protocol-kit'
import type { MessageItem, MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { BaseWallet } from 'ethers'
import { setTimeout as sleep } from 'node:timers/promises'
import { addMessageToQueue, confirmMessageInQueue } from '../../environment/scenarios/gateway.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { safeService } from '../../environment/scenarios/safe.mjs'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import type { SeededSafe } from './safe'

const isMessage = (item: MessagePage['results'][number]): item is MessageItem => item.type === 'MESSAGE'

/** Posts an off-chain message signed by Alice, waits until CGW lists it, and returns its Safe message hash. */
export async function seedOffchainMessage(safe: SeededSafe, message: string): Promise<string> {
  const { context } = safe
  const signed = await context.safe.signMessage(context.safe.createMessage(message))
  await addMessageToQueue(context, message, signed.encodedSignatures())
  const messageHash = await context.safe.getSafeMessageHash(hashSafeMessage(message))
  await waitUntil(context.env, `${context.path}/messages`, (page: MessagePage) =>
    page.results.some((item) => 'messageHash' in item && item.messageHash === messageHash),
  )
  return messageHash
}

/**
 * Waits until CGW lists one pending message of `safeAddress`, and confirms it as `owner`, an EOA owner of that Safe.
 * The message hash is the EIP-712 digest of the SafeMessage, so signing the hash is what the owner's wallet does.
 */
export async function confirmPendingMessage(
  env: JourneyEnvironment,
  safeAddress: string,
  owner: BaseWallet,
): Promise<string> {
  const context = safeService(env, safeAddress)
  let messageHash = ''
  let modifiedTimestamp = 0
  await waitUntil(env, `${context.path}/messages`, (page: MessagePage) => {
    const pending = page.results.filter(isMessage).find((item) => item.status === 'NEEDS_CONFIRMATION')
    messageHash = pending?.messageHash ?? ''
    modifiedTimestamp = pending?.modifiedTimestamp ?? 0
    return !!pending
  })
  // messagesTag has whole seconds: a signature in the same second as the last change never refreshes an open dialog
  const nextSecond = (Math.floor(modifiedTimestamp / 1000) + 1) * 1000
  await sleep(Math.max(0, nextSecond - Date.now()))
  await confirmMessageInQueue(context, messageHash, owner.signingKey.sign(messageHash).serialized)
  return messageHash
}
