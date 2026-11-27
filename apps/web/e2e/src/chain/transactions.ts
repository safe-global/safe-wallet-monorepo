import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The account that sent the transaction `txHash` on the local fork, in lower case */
export function senderOf(env: JourneyEnvironment, txHash: string): Promise<string> {
  return readChain(env, async (provider) => {
    const transaction = await provider.getTransaction(txHash)
    if (!transaction) throw new Error(`No transaction ${txHash} on the local fork`)
    return transaction.from.toLowerCase()
  })
}

/** The fees per gas that the transaction `txHash` was sent with on the local fork, in wei; null for a legacy one. */
export function gasFeesOf(
  env: JourneyEnvironment,
  txHash: string,
): Promise<{ maxPriorityFeePerGas: bigint | null; maxFeePerGas: bigint | null }> {
  return readChain(env, async (provider) => {
    const transaction = await provider.getTransaction(txHash)
    if (!transaction) throw new Error(`No transaction ${txHash} on the local fork`)
    return { maxPriorityFeePerGas: transaction.maxPriorityFeePerGas, maxFeePerGas: transaction.maxFeePerGas }
  })
}
