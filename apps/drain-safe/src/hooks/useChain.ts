import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient, custom } from 'viem'
import { getEnsAddress } from 'viem/actions'
import { mainnet, sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import type SafeAppsSDK from '@safe-global/safe-apps-sdk'
import type { ResolveName } from '../utils/recipient'

const ENS_CHAINS = { [mainnet.id]: mainnet, [sepolia.id]: sepolia }

type CallParams = Parameters<SafeAppsSDK['eth']['call']>[0]

const ethCallTransport = (sdk: SafeAppsSDK) =>
  custom({
    async request({ method, params }) {
      if (method !== 'eth_call') throw new Error(`The Safe App transport does not support ${method}`)
      return sdk.eth.call(params as CallParams)
    },
  })

type Chain = {
  networkPrefix: string
  gasPrice: bigint
  resolveName: ResolveName
}

export function useChain(): Chain {
  const { sdk, safe } = useSafeAppsSDK()
  const [networkPrefix, setNetworkPrefix] = useState('')
  const [gasPrice, setGasPrice] = useState(0n)

  useEffect(() => {
    sdk.safe
      .getChainInfo()
      .then(({ shortName }) => setNetworkPrefix(shortName))
      .catch((error: Error) => console.error('Could not load the chain info', error))

    sdk.eth
      .getGasPrice()
      .then((price) => setGasPrice(BigInt(price)))
      .catch((error: Error) => console.error('Could not load the gas price', error))
  }, [sdk])

  const client = useMemo(() => {
    const chain = ENS_CHAINS[safe.chainId as keyof typeof ENS_CHAINS]
    return chain && createClient({ chain, transport: ethCallTransport(sdk) })
  }, [safe.chainId, sdk])

  const resolveName = useCallback(
    async (name: string) => (client ? getEnsAddress(client, { name: normalize(name) }) : null),
    [client],
  )

  return { networkPrefix, gasPrice, resolveName }
}
