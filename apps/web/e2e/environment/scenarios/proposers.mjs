import { addDelegateToQueue } from './gateway.mjs'
import { waitUntil } from './indexing.mjs'

export async function addDelegates(env, context, delegates) {
  for (const delegate of delegates) await addDelegateToQueue(context, delegate)
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v3/chains/${context.chainId}/delegates?safe=${context.safeAddress}`,
    (result) => result.results?.length === delegates.length,
  )
}
