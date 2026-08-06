import { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from 'react'
import SafeAppsSDK, { ChainInfo, SafeInfo } from '@safe-global/safe-apps-sdk'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { getChainConfig } from '@safe-global/safe-gateway-typescript-sdk'
import InterfaceRepository, { InterfaceRepo } from '../lib/interfaceRepository'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { SafeAppProvider } from '@safe-global/safe-apps-provider'
import { getEnsHubChainId, resolveNameForChain } from '@safe-global/utils/utils/ens'

type NetworkContextProps = {
  sdk: SafeAppsSDK
  safe: SafeInfo
  chainInfo: ChainInfo | undefined
  provider: BrowserProvider | undefined
  interfaceRepo: InterfaceRepo | undefined
  networkPrefix: string
  nativeCurrencySymbol: string | undefined
  getAddressFromDomain: (name: string) => Promise<string>
}

export const NetworkContext = createContext<NetworkContextProps | null>(null)

// The hub RPC (Mainnet/Sepolia Universal Resolver) is settled once from the gateway config.
// While it is unknown (config still loading or unavailable) names are left unresolved rather
// than being resolved against a guessed hub.
const createEnsHubProvider = async (chainId: string): Promise<JsonRpcProvider | undefined> => {
  const config = await getChainConfig(chainId)
  const hubChainId = getEnsHubChainId(!!config.isTestnet)
  const hubConfig = hubChainId === chainId ? config : await getChainConfig(hubChainId)
  const rpcUrl = hubConfig.publicRpcUri?.value || hubConfig.rpcUri?.value
  if (!rpcUrl) return undefined

  // Match web's createWeb3ReadOnly: Infura and similar RPCs reject large batches.
  return new JsonRpcProvider(rpcUrl, Number(hubChainId), { staticNetwork: true, batchMaxCount: 3 })
}

const NetworkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { sdk, safe } = useSafeAppsSDK()
  const [provider, setProvider] = useState<BrowserProvider | undefined>()
  const [chainInfo, setChainInfo] = useState<ChainInfo>()
  const [interfaceRepo, setInterfaceRepo] = useState<InterfaceRepository | undefined>()
  const [ensHubProvider, setEnsHubProvider] = useState<JsonRpcProvider | undefined>()

  useEffect(() => {
    if (!chainInfo) {
      return
    }

    const safeProvider = new SafeAppProvider(safe, sdk)
    const ethersProvider = new BrowserProvider(safeProvider)
    const interfaceRepo = new InterfaceRepository(chainInfo)

    setProvider(ethersProvider)
    setInterfaceRepo(interfaceRepo)
  }, [chainInfo, safe, sdk])

  useEffect(() => {
    const getChainInfo = async () => {
      try {
        const chainInfo = await sdk.safe.getChainInfo()
        setChainInfo(chainInfo)

        try {
          setEnsHubProvider(await createEnsHubProvider(chainInfo.chainId))
        } catch (error) {
          console.error('Unable to configure the ENS hub provider:', error)
        }
      } catch (error) {
        console.error('Unable to get chain info:', error)
      }
    }

    getChainInfo()
  }, [sdk.safe])

  useEffect(() => () => ensHubProvider?.destroy(), [ensHubProvider])

  const networkPrefix = chainInfo?.shortName || ''

  const nativeCurrencySymbol = chainInfo?.nativeCurrency.symbol

  const getAddressFromDomain = useCallback(
    async (name: string): Promise<string> => {
      if (!chainInfo || !ensHubProvider) return name
      try {
        const address = await resolveNameForChain(ensHubProvider, name, Number(chainInfo.chainId))
        return address ?? name
      } catch {
        return name
      }
    },
    [chainInfo, ensHubProvider],
  )

  return (
    <NetworkContext.Provider
      value={{
        sdk,
        safe,
        chainInfo,
        provider,
        interfaceRepo,
        networkPrefix,
        nativeCurrencySymbol,
        getAddressFromDomain,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetwork = () => {
  const contextValue = useContext(NetworkContext)
  if (contextValue === null) {
    throw new Error('Component must be wrapped with <TransactionProvider>')
  }

  return contextValue
}

export default NetworkProvider
