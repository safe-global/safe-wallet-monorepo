import { hashSafeMessage } from '@safe-global/protocol-kit'
import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { addMessageToQueue } from '../../environment/scenarios/gateway.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import type { SeededSafe } from './safe'

/** Posts an off-chain message signed by OWNER_4, waits until CGW lists it, and returns its Safe message hash. */
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
