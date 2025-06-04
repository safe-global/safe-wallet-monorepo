import { Contract, AbstractProvider } from 'ethers'
import { CANONICAL_MULTICALL_ADDRESSS, MULTICALL_DEPLOYMENTS } from './deployments'

// Multicall contract ABI
export const MULTICALL_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
]

/**
 * Get the multicall contract address for a given chain ID
 * @param chainId The chain ID to get the multicall address for
 * @returns The multicall contract address for the given chain ID
 */
export const getMultiCallAddress = (chainId: string): string | null => {
  const deployment = MULTICALL_DEPLOYMENTS.find((deployment) => deployment.chainId.toString() === chainId)
  if (!deployment) {
    return null
  }
  return deployment.address ?? CANONICAL_MULTICALL_ADDRESSS
}

export type Aggregate3Response = { success: boolean; returnData: string }

const fallbackMulticall = async (provider: AbstractProvider, calls: { to: string; data: string }[]) => {
  const results: Aggregate3Response[] = []
  for (const call of calls) {
    try {
      const result = await provider.call(call)
      results.push({ success: true, returnData: result })
    } catch (error) {
      results.push({ success: false, returnData: '0x' })
    }
  }
  return results
}

/**
 * Execute multiple calls in a single RPC request using the multicall contract
 * @param provider The ethers provider to use
 * @param calls Array of calls to execute, each containing target address and call data
 * @param chainId The chain ID to execute the calls on
 * @returns Array of return data from each call
 */
export const multicall = async (
  provider: AbstractProvider,
  calls: { to: string; data: string }[],
): Promise<{ success: boolean; returnData: string }[]> => {
  if (calls.length === 0) {
    return []
  }
  const chainId = (await provider.getNetwork()).chainId.toString()

  const multicallAddress = getMultiCallAddress(chainId)
  if (!multicallAddress || calls.length === 1) {
    // Fallback to consecutive calls if multicall is not supported or if there is only one call
    return fallbackMulticall(provider, calls)
  }

  const multicallContract = new Contract(multicallAddress, MULTICALL_ABI, provider)

  try {
    const calls3 = calls.map((call) => ({
      target: call.to,
      allowFailure: true,
      callData: call.data,
    }))

    const resolverResults: Aggregate3Response[] = await multicallContract.aggregate3.staticCall(calls3)
    return resolverResults
  } catch (error) {
    throw new Error(`Multicall failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
