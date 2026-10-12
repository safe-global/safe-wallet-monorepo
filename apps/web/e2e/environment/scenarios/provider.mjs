import { JsonRpcProvider } from 'ethers'

// A fixed limit skips the gas estimate, for which Anvil simulates each transaction several times.
const SETUP_GAS_LIMIT = 10_000_000n

/** A provider for the local Anvil fork; it reads the chain ID once instead of before every request. */
export function localProvider(url) {
  return new JsonRpcProvider(url, undefined, { cacheTimeout: -1, pollingInterval: 100, staticNetwork: true })
}

/**
 * Sends a setup transaction and returns its receipt; throws with the revert reason if it failed.
 * Anvil mines each transaction on arrival, so the receipt is read once instead of polled.
 */
export async function sendAndConfirm(signer, transaction) {
  const response = await signer.sendTransaction({ gasLimit: SETUP_GAS_LIMIT, ...transaction })
  const receipt =
    (await signer.provider.getTransactionReceipt(response.hash)) ??
    (await response.wait().catch((error) => error.receipt ?? Promise.reject(error)))
  if (receipt?.status === 1) return receipt
  const from = await signer.getAddress()
  const reason = await signer.provider.estimateGas({ ...transaction, from }).then(
    () => 'the replay succeeded',
    (error) => error.shortMessage ?? error.message,
  )
  throw new Error(`Setup transaction from ${from} failed: ${reason}`)
}
