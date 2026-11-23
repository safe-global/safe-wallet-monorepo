import { id, Interface, type Log, type Provider } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const safeEvents = new Interface([
  'event SafeSetup(address indexed initiator, address[] owners, uint256 threshold, address initializer, address fallbackHandler)',
  'event ChangedFallbackHandler(address indexed handler)',
])
const SAFE_SETUP_TOPIC = id('SafeSetup(address,address[],uint256,address,address)')
const CHANGED_FALLBACK_HANDLER_TOPIC = id('ChangedFallbackHandler(address)')

const byPosition = (a: Log, b: Log): number => a.blockNumber - b.blockNumber || a.index - b.index

const handlerOf = (log: Log): string | undefined => {
  const event = safeEvents.parseLog(log)
  if (!event) return undefined
  return event.name === 'SafeSetup' ? event.args.fallbackHandler : event.args.handler
}

/**
 * The fallback handler the Safe used before its latest change to `tokenCallbackHandler`, read from the Safe's own
 * events. Undefined when the Safe never changed to it.
 */
export const readPreviousFallbackHandler = async (
  provider: Provider,
  safeAddress: string,
  tokenCallbackHandler: string,
): Promise<string | undefined> => {
  const logs = await provider.getLogs({
    address: safeAddress,
    fromBlock: 0,
    toBlock: 'latest',
    topics: [[SAFE_SETUP_TOPIC, CHANGED_FALLBACK_HANDLER_TOPIC]],
  })
  const handlers = [...logs].sort(byPosition).map(handlerOf)
  const change = handlers.findLastIndex((handler, index) => index > 0 && sameAddress(handler, tokenCallbackHandler))

  return change > 0 ? handlers[change - 1] : undefined
}
