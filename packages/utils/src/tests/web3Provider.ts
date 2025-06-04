import { JsonRpcProvider, id, AbiCoder, Network, Interface } from 'ethers'
import { MULTICALL_ABI } from '../utils/multicall'
import { sameAddress } from '../utils/addresses'

export type MockCallImplementation = {
  signature: string
  to?: string
  returnType: string
  returnValue: unknown
}

const MULTI_CALL_INTERFACE = new Interface(MULTICALL_ABI)

/**
 * Creates a getWeb3 spy which returns a Web3Provider with a mocked `call` and `resolveName` function.
 * It will automatically handle multicalls.
 *
 * @param callImplementations list of supported function calls and the mocked return value. i.e.
 * ```
 * [{
 *   signature: "balanceOf(address)",
 *   returnType: "uint256",
 *   returnValue: "200"
 * }]
 * ```
 * @param resolveName mock ens resolveName implementation
 * @param chainId mock chainId
 * @returns web3provider jest spy
 */
export const createMockWeb3Provider = (
  callImplementations: MockCallImplementation[],
  resolveName?: (name: string) => string,
  chainId?: string,
): JsonRpcProvider => {
  const findImplementation = (data: string, to: string) => {
    return callImplementations.find((implementation) => {
      const sigHash = implementation.signature.startsWith('0x')
        ? implementation.signature
        : id(implementation.signature)
      return data?.startsWith(sigHash.slice(0, 10)) && (implementation.to ? sameAddress(to, implementation.to) : true)
    })
  }

  const mockWeb3ReadOnly = {
    getNetwork: jest.fn(() => {
      return new Network('mock', BigInt(chainId ?? 1))
    }),
    call: jest.fn((tx: { data: string; to: string }) => {
      const multiCallSignature = MULTI_CALL_INTERFACE.getFunction('aggregate3')?.selector!
      // Auto handle multicalls
      if (
        tx.data.startsWith(multiCallSignature) &&
        !callImplementations.some((implementation) => implementation.signature === multiCallSignature)
      ) {
        // Unwrap multicall and check if any selectors match
        const calls = MULTI_CALL_INTERFACE.decodeFunctionData('aggregate3', tx.data)[0]
        const results: { success: boolean; returnData: string }[] = []
        for (const call of calls) {
          const [target, allowFailure, callData] = call
          const matchedImplementation = findImplementation(callData, target)
          if (!matchedImplementation) {
            console.log('No matched implementation for call', callData)
            results.push({
              success: false,
              returnData: '0x',
            })
          } else {
            const returnData =
              matchedImplementation.returnType === 'raw'
                ? (matchedImplementation.returnValue as string)
                : AbiCoder.defaultAbiCoder().encode(
                    [matchedImplementation.returnType],
                    [matchedImplementation.returnValue],
                  )
            results.push({
              success: true,
              returnData,
            })
          }
        }

        return MULTI_CALL_INTERFACE.encodeFunctionResult('aggregate3', [results])
      }

      const matchedImplementation = findImplementation(tx.data, tx.to)

      if (!matchedImplementation) {
        throw new Error(`No matcher for call data: ${tx.data}`)
      }

      if (matchedImplementation.returnType === 'raw') {
        return matchedImplementation.returnValue as string
      }

      return AbiCoder.defaultAbiCoder().encode([matchedImplementation.returnType], [matchedImplementation.returnValue])
    }),
    estimateGas: jest.fn(() => {
      return Promise.resolve(50_000n)
    }),
    getTransactionReceipt: jest.fn(),
    _isProvider: true,
    resolveName,
  } as unknown as JsonRpcProvider

  return mockWeb3ReadOnly
}
