import { JsonRpcProvider, id, AbiCoder, Network } from 'ethers'

export type MockCallImplementation = {
  signature: string
  returnType: string
  returnValue: unknown
}

/**
 * Creates a getWeb3 spy which returns a Web3Provider with a mocked `call` and `resolveName` function.
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
  const mockWeb3ReadOnly = {
    getNetwork: jest.fn(() => {
      return new Network('mock', BigInt(chainId ?? 1))
    }),
    call: jest.fn((tx: { data: string; to: string }) => {
      {
        const matchedImplementation = callImplementations.find((implementation) => {
          const sigHash = implementation.signature.startsWith('0x')
            ? implementation.signature
            : id(implementation.signature)
          return tx.data.startsWith(sigHash.slice(0, 10))
        })

        if (!matchedImplementation) {
          throw new Error(`No matcher for call data: ${tx.data}`)
        }

        if (matchedImplementation.returnType === 'raw') {
          return matchedImplementation.returnValue as string
        }

        return AbiCoder.defaultAbiCoder().encode(
          [matchedImplementation.returnType],
          [matchedImplementation.returnValue],
        )
      }
    }),
    estimateGas: jest.fn(() => {
      return Promise.resolve(50_000n)
    }),
    _isProvider: true,
    resolveName,
  } as unknown as JsonRpcProvider
  return mockWeb3ReadOnly
}
