import type { PropsWithChildren } from 'react'
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionResult,
  namehash,
  parseAbi,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem'
import type SafeAppsSDK from '@safe-global/safe-apps-sdk'
import type { BaseTransaction, ChainInfo, SafeBalances, SafeInfo } from '@safe-global/safe-apps-sdk'

export const SAFE_INFO: SafeInfo = {
  safeAddress: '0x4DD4cB2299E491E1B469245DB589ccB2B16d7bde',
  chainId: 11155111,
  threshold: 1,
  owners: ['0xc6b82bA149CFA113f8f48d5E3b1F78e933e16DfD'],
  isReadOnly: false,
}

export const CHAIN_INFO: ChainInfo = {
  chainName: 'Sepolia',
  chainId: '11155111',
  shortName: 'sep',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
  blockExplorerUriTemplate: {
    address: 'https://sepolia.etherscan.io/address/{{address}}',
    txHash: 'https://sepolia.etherscan.io/tx/{{txHash}}',
    api: 'https://api-sepolia.etherscan.io/api',
  },
}

const ENS_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD'
const universalResolver = parseAbi([
  'function resolveWithGateways(bytes name, bytes data, string[] gateways) view returns (bytes, address)',
])
const resolver = parseAbi(['function addr(bytes32 node) view returns (address)'])
const ensNames = new Map<Hex, Address>()

export const registerEnsName = (name: string, address: Address): void => {
  ensNames.set(namehash(name), address)
}

const answerEnsCall = async ([tx]: [{ data: Hex }]): Promise<Hex> => {
  const { args } = decodeFunctionData({ abi: universalResolver, data: tx.data })
  const {
    args: [node],
  } = decodeFunctionData({ abi: resolver, data: args[1] })
  const address = ensNames.get(node)

  return encodeFunctionResult({
    abi: universalResolver,
    functionName: 'resolveWithGateways',
    result: address ? [encodeAbiParameters([{ type: 'address' }], [address]), ENS_RESOLVER] : ['0x', zeroAddress],
  })
}

export const fakeSdk = {
  safe: {
    getChainInfo: jest.fn<Promise<ChainInfo>, []>(),
    experimental_getBalances: jest.fn<Promise<SafeBalances>, []>(),
  },
  txs: {
    send: jest.fn<Promise<{ safeTxHash: string }>, [{ txs: BaseTransaction[] }]>(),
  },
  eth: {
    call: jest.fn<Promise<Hex>, [[{ data: Hex }]]>(),
    getGasPrice: jest.fn<Promise<string>, []>(),
    getEstimateGas: jest.fn<Promise<number>, [unknown]>(),
  },
}

export const resetFakeSdk = (): void => {
  ensNames.clear()
  fakeSdk.safe.getChainInfo.mockReset().mockResolvedValue(CHAIN_INFO)
  fakeSdk.safe.experimental_getBalances.mockReset().mockResolvedValue({ fiatTotal: '0', items: [] })
  fakeSdk.txs.send.mockReset().mockResolvedValue({ safeTxHash: `0x${'0'.repeat(64)}` })
  fakeSdk.eth.call.mockReset().mockImplementation(answerEnsCall)
  fakeSdk.eth.getGasPrice.mockReset().mockResolvedValue('0x0')
  fakeSdk.eth.getEstimateGas.mockReset().mockResolvedValue(21000)
}

export const safeAppsReactSdkFake = {
  SafeProvider: ({ children }: PropsWithChildren) => children,
  useSafeAppsSDK: () => ({ sdk: fakeSdk as unknown as SafeAppsSDK, safe: SAFE_INFO, connected: true }),
}
