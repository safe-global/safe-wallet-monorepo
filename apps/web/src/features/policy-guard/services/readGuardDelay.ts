import { Interface, type JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { getRpcErrorContext } from '@/hooks/wallets/rpcEndpointInfo'
import { logError } from '@/services/exceptions'
import { isRateLimitError } from '@/utils/transaction-errors'

const guardInterface = new Interface(['function DELAY() view returns (uint256)'])

/** The guard's root-activation delay, in seconds */
export const readGuardDelay = async (provider: JsonRpcProvider, guardAddress: string): Promise<number> => {
  let result: string
  try {
    result = await provider.call({ to: guardAddress, data: guardInterface.encodeFunctionData('DELAY') })
  } catch (error) {
    if (!isRateLimitError(error)) logError(ErrorCodes._657, error, getRpcErrorContext(provider))
    throw error
  }
  const [delay] = guardInterface.decodeFunctionResult('DELAY', result)
  return Number(delay)
}
