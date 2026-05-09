import axios from 'axios'
import { ChainInfo } from '@safe-global/safe-apps-sdk'
import { ContractMethod } from '../typings/models'

enum PROVIDER {
  SOURCIFY = 1,
  GATEWAY = 2,
}

type SourcifyV2Response = {
  abi: ContractMethod[]
  matchId: string
  creationMatch: 'exact_match' | 'match' | null
  runtimeMatch: 'exact_match' | 'match' | null
  match: 'exact_match' | 'match' | null
  verifiedAt: string
  chainId: string
  address: string
}

interface GatewayContractResponse {
  contractAbi?: {
    abi: ContractMethod[]
  }
}

const DEFAULT_TIMEOUT = 10000

const getProviderURL = (chain: string, address: string, urlProvider: PROVIDER): string => {
  switch (urlProvider) {
    case PROVIDER.SOURCIFY:
      return `https://sourcify.dev/server/v2/contract/${chain}/${address}?fields=abi`
    case PROVIDER.GATEWAY:
      return `https://safe-client.safe.global/v1/chains/${chain}/contracts/${address}`
    default:
      throw new Error('The Provider is not supported')
  }
}

const getAbiFromSourcify = async (address: string, chainId: string): Promise<ContractMethod[]> => {
  const { data } = await axios.get<SourcifyV2Response>(getProviderURL(chainId, address, PROVIDER.SOURCIFY), {
    timeout: DEFAULT_TIMEOUT,
  })

  if (data.abi) {
    return data.abi
  }

  throw new Error('Contract found but could not find ABI using Sourcify')
}

const getAbiFromGateway = async (address: string, chainName: string): Promise<ContractMethod[]> => {
  const { data } = await axios.get<GatewayContractResponse>(getProviderURL(chainName, address, PROVIDER.GATEWAY), {
    timeout: DEFAULT_TIMEOUT,
  })

  // We need to check if the abi is present in the response because it's possible
  // That the transaction service just stores the contract and returns 200 without querying for the abi
  // (or querying for the abi failed)
  if (data && data.contractAbi?.abi) {
    return data.contractAbi.abi
  }

  throw new Error('Contract found but could not found ABI using the Gateway')
}

const getAbi = async (address: string, chainInfo: ChainInfo): Promise<ContractMethod[] | null> => {
  try {
    return await getAbiFromSourcify(address, chainInfo.chainId)
  } catch {
    try {
      return await getAbiFromGateway(address, chainInfo.chainId)
    } catch {
      return null
    }
  }
}

export default getAbi
