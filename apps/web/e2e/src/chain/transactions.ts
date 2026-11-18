import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The max fee per gas that the transaction `txHash` was sent with on the local fork, in wei; null for a legacy one. */
export function maxFeePerGasOf(env: JourneyEnvironment, txHash: string): Promise<bigint | null> {
  return readChain(env, async (provider) => {
    const transaction = await provider.getTransaction(txHash)
    if (!transaction) throw new Error(`No transaction ${txHash} on the local fork`)
    return transaction.maxFeePerGas
  })
}
