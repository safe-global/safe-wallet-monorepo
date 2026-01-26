import axios from 'axios'
import { ChainInfo } from '@safe-global/safe-apps-sdk'
import { ContractMethod } from '../typings/models'

enum PROVIDER {
  SOURCIFY = 1,
  GATEWAY = 2,
}

type SourcifyResponse = {
  name: string
  path: string
  content: string
}

interface GatewayContractResponse {
  contractAbi?: {
    abi: ContractMethod[]
  }
}

const METADATA_FILE = 'metadata.json'
const DEFAULT_TIMEOUT = 10000

const getProviderURL = (chain: string, address: string, urlProvider: PROVIDER): string => {
  switch (urlProvider) {
    case PROVIDER.SOURCIFY:
      return `https://sourcify.dev/server/files/${chain}/${address}`
    case PROVIDER.GATEWAY:
      return `https://safe-client.safe.global/v1/chains/${chain}/contracts/${address}`
    default:
      throw new Error('The Provider is not supported')
  }
}

const getAbiFromSourcify = async (address: string, chainId: string): Promise<ContractMethod[]> => {
  const { data } = await axios.get<SourcifyResponse[]>(getProviderURL(chainId, address, PROVIDER.SOURCIFY), {
    timeout: DEFAULT_TIMEOUT,
  })

  if (data.length) {
    const metadata = data.find((item: SourcifyResponse) => item.name === METADATA_FILE)
    const abi = metadata && JSON.parse(metadata.content)?.output?.abi
    if (abi) return abi
  }

  throw new Error('Contract found but could not found abi using Sourcify')
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
