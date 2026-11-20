import { Interface } from 'ethers'
import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

const safeEvents = new Interface(['event ExecutionSuccess(bytes32 indexed txHash, uint256 payment)'])

/** The gas refund that a Safe (1.4.1 or later) paid in the execution `txHash`, from its `ExecutionSuccess` event, in wei. */
export function refundPaidIn(env: JourneyEnvironment, txHash: string): Promise<bigint> {
  return readChain(env, async (provider) => {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) throw new Error(`No receipt for ${txHash} on the local fork`)
    for (const log of receipt.logs) {
      const event = safeEvents.parseLog(log)
      if (event?.name === 'ExecutionSuccess') return BigInt(event.args.payment)
    }
    throw new Error(`${txHash} executed no Safe transaction`)
  })
}
