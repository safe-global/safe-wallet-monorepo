// ethers does not export this type, so we have to define it ourselves
// the type is based on the following code:
// https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/logger/src.ts/index.ts#L197
interface EthersError extends Error {
  reason: string
  code: string
}

const isEthersError = (error: unknown): error is EthersError => {
  return typeof error === 'object' && error !== null && 'reason' in error && 'code' in error
}

export type { EthersError }
export { isEthersError }
