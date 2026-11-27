import { Interface, type JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { logError } from '@/services/exceptions'
import { isRateLimitError } from '@/utils/transaction-errors'

const guardInterface = new Interface(['function rootConfigured(address safe, bytes32 root) view returns (uint256)'])

/** The roots the guard still holds for the Safe: requested, and neither applied nor withdrawn. */
export const readHeldRoots = async (
  provider: JsonRpcProvider,
  guardAddress: string,
  safeAddress: string,
  roots: string[],
): Promise<string[]> => {
  let results: string[]
  try {
    results = await Promise.all(
      roots.map((root) =>
        provider.call({
          to: guardAddress,
          data: guardInterface.encodeFunctionData('rootConfigured', [safeAddress, root]),
        }),
      ),
    )
  } catch (error) {
    if (!isRateLimitError(error)) logError(ErrorCodes._659, error, getRpcErrorContext(provider))
    throw error
  }
  return roots.filter((_, index) => {
    const [readyAt] = guardInterface.decodeFunctionResult('rootConfigured', results[index])
    return BigInt(readyAt) > 0n
  })
}
