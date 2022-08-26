import { MutableRefObject, useEffect, useMemo, useState } from 'react'
import { getAddress } from 'ethers/lib/utils'
import { getBalances, getTransactionDetails, SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'
import {
  GetBalanceParams,
  GetTxBySafeTxHashParams,
  Methods,
  RPCPayload,
  SendTransactionsParams,
  SignMessageParams,
} from '@gnosis.pm/safe-apps-sdk'
import AppCommunicator from '@/services/safe-apps/AppCommunicator'
import { Errors, logError } from '@/services/exceptions'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsGranted from '@/hooks/useIsGranted'
import { useCurrentChain } from '@/hooks/useChains'
import { createSafeAppsWeb3Provider } from '@/hooks/wallets/web3'

type JsonRpcResponse = {
  jsonrpc: string
  id: number
  result?: any
  error?: string
}

const useAppCommunicator = (iframeRef: MutableRefObject<HTMLIFrameElement | null>, app?: SafeAppData) => {
  const [communicator, setCommunicator] = useState<AppCommunicator | undefined>(undefined)

  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const granted = useIsGranted()

  const safeAppWeb3Provider = useMemo(() => {
    if (!chain) {
      return
    }

    return createSafeAppsWeb3Provider(chain)
  }, [chain])

  useEffect(() => {
    let communicatorInstance: AppCommunicator
    const initCommunicator = (iframeRef: MutableRefObject<HTMLIFrameElement>, app?: SafeAppData) => {
      communicatorInstance = new AppCommunicator(iframeRef, {
        onError: (error, data) => {
          logError(Errors._901, error.message, {
            contexts: {
              safeApp: app || {},
              request: data,
            },
          })
        },
      })

      setCommunicator(communicatorInstance)
    }

    if (app) {
      initCommunicator(iframeRef as MutableRefObject<HTMLIFrameElement>, app)
    }

    return () => {
      communicatorInstance?.clear()
    }
  }, [app, iframeRef])

  // Adding communicator logic for the required SDK Methods
  // We don't need to unsubscribe from the events because there can be just one subscription
  // per event type and the next effect run will simply replace the handlers
  useEffect(() => {
    const { nativeCurrency, chainName, chainId, shortName, blockExplorerUriTemplate } = chain || { chainId: '' }

    communicator?.on(Methods.getTxBySafeTxHash, async (msg) => {
      const { safeTxHash } = msg.data.params as GetTxBySafeTxHashParams

      const tx = await getTransactionDetails(chainId, safeTxHash)

      return tx
    })

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }))

    communicator?.on(Methods.getSafeInfo, () => ({
      safeAddress,
      chainId: parseInt(chainId, 10),
      owners: safe.owners.map((owner) => owner.value),
      threshold: safe.threshold,
      isReadOnly: !granted,
    }))

    communicator?.on(Methods.getSafeBalances, async (msg) => {
      const { currency = 'usd' } = msg.data.params as GetBalanceParams

      return getBalances(chainId, safeAddress, currency, {
        exclude_spam: true,
        trusted: false,
      })
    })

    communicator?.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload

      try {
        return await safeAppWeb3Provider?.send(params.call, params.params)
      } catch (err) {
        throw new Error((err as JsonRpcResponse).error)
      }
    })

    communicator?.on(Methods.sendTransactions, (msg) => {
      const { txs, params } = msg.data.params as SendTransactionsParams

      const transactions = txs.map(({ to, ...rest }) => ({
        to: getAddress(to),
        ...rest,
      }))

      // openConfirmationModal(transactions, params, msg.data.id)
    })

    communicator?.on(Methods.signMessage, async (msg) => {
      const { message } = msg.data.params as SignMessageParams

      // openSignMessageModal(message, msg.data.id)
    })

    communicator?.on(Methods.getChainInfo, async () => {
      return {
        chainName,
        chainId,
        shortName,
        nativeCurrency,
        blockExplorerUriTemplate,
      }
    })
  }, [chain, communicator, granted, safe, safeAddress, safeAppWeb3Provider])
}

export default useAppCommunicator
