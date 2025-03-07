import { SAFENET_API_URL } from '@/config/constants'
import useHasSafenetFeature from '@/features/safenet/hooks/useHasSafenetFeature'
import type { SafePermissionsRequest } from '@/hooks/safe-apps/permissions'
import { useDarkMode } from '@/hooks/useDarkMode'
import { createSafeAppsWeb3Provider } from '@/hooks/wallets/web3'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import { Errors, logError } from '@/services/exceptions'
import AppCommunicator from '@/services/safe-apps/AppCommunicator'
import { useAppSelector } from '@/store'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { selectRpc } from '@/store/settingsSlice'
import { QueryStatus } from '@reduxjs/toolkit/query'
import { skipToken } from '@reduxjs/toolkit/query/react'
import type {
  AddressBookItem,
  BaseTransaction,
  ChainInfo,
  EIP712TypedData,
  EnvironmentInfo,
  GetBalanceParams,
  GetTxBySafeTxHashParams,
  RPCPayload,
  RequestId,
  SafeInfoExtended,
  SafeSettings,
  SendTransactionRequestParams,
  SendTransactionsParams,
  SignMessageParams,
  SignTypedMessageParams,
} from '@safe-global/safe-apps-sdk'
import { Methods, RPC_CALLS } from '@safe-global/safe-apps-sdk'
import type { Permission, PermissionRequest } from '@safe-global/safe-apps-sdk/dist/types/types/permissions'
import type {
  SafeAppData,
  TransactionDetails,
  ChainInfo as WebCoreChainInfo,
} from '@safe-global/safe-gateway-typescript-sdk'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { getAddress } from 'ethers'
import type { MutableRefObject } from 'react'
import { useEffect, useMemo, useState } from 'react'

export enum CommunicatorMessages {
  REJECT_TRANSACTION_MESSAGE = 'Transaction was rejected',
}

type JsonRpcResponse = {
  jsonrpc: string
  id: number
  result?: any
  error?: string
}

export type UseAppCommunicatorHandlers = {
  onConfirmTransactions: (txs: BaseTransaction[], requestId: RequestId, params?: SendTransactionRequestParams) => void
  onSignMessage: (
    message: string | EIP712TypedData,
    requestId: string,
    method: Methods.signMessage | Methods.signTypedMessage,
    sdkVersion: string,
  ) => void
  onGetTxBySafeTxHash: (transactionId: string) => Promise<TransactionDetails>
  onGetEnvironmentInfo: () => EnvironmentInfo
  onGetSafeBalances: (currency: string) => Promise<Balances>
  onGetSafeInfo: () => SafeInfoExtended
  onGetChainInfo: () => ChainInfo | undefined
  onGetPermissions: (origin: string) => Permission[]
  onSetPermissions: (permissionsRequest?: SafePermissionsRequest) => void
  onRequestAddressBook: (origin: string) => AddressBookItem[]
  onSetSafeSettings: (settings: SafeSettings) => SafeSettings
  onGetOffChainSignature: (messageHash: string) => Promise<string | undefined>
}

const useAppCommunicator = (
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  app: SafeAppData | undefined,
  chain: WebCoreChainInfo | undefined,
  handlers: UseAppCommunicatorHandlers,
): AppCommunicator | undefined => {
  const [communicator, setCommunicator] = useState<AppCommunicator | undefined>(undefined)
  const customRpc = useAppSelector(selectRpc)
  const hasSafenetFeature = useHasSafenetFeature()
  const { data: safenetConfig, status: safenetConfigStatus } = useGetSafenetConfigQuery(
    !hasSafenetFeature ? skipToken : undefined,
  )
  const shouldUseSafenetRpc =
    safenetConfigStatus === QueryStatus.fulfilled &&
    chain &&
    safenetConfig &&
    safenetConfig.chains.includes(Number(chain.chainId))
  const isDarkMode = useDarkMode()

  const safeAppWeb3Provider = useMemo(() => {
    if (!chain) {
      return
    }

    if (shouldUseSafenetRpc) {
      return createSafeAppsWeb3Provider(chain, SAFENET_API_URL + `/jsonrpc/${chain.chainId}/`)
    }

    return createSafeAppsWeb3Provider(chain, customRpc?.[chain.chainId])
  }, [chain, customRpc, shouldUseSafenetRpc])

  useEffect(() => {
    let communicatorInstance: AppCommunicator

    const initCommunicator = (iframeRef: MutableRefObject<HTMLIFrameElement | null>, app?: SafeAppData) => {
      communicatorInstance = new AppCommunicator(iframeRef, {
        onMessage: (msg) => {
          if (!msg.data) return

          const isCustomApp = app && app.id < 1

          trackSafeAppEvent(
            { ...SAFE_APPS_EVENTS.SAFE_APP_SDK_METHOD_CALL },
            isCustomApp ? app?.url : app?.name || '',
            {
              method: msg.data.method,
              ethMethod: (msg.data.params as any)?.call,
              version: msg.data.env.sdkVersion,
            },
          )
        },
        onError: (error) => {
          logError(Errors._901, error.message)
        },
      })

      setCommunicator(communicatorInstance)
    }

    if (app) {
      initCommunicator(iframeRef, app)
    }

    return () => {
      communicatorInstance?.clear()
    }
  }, [app, iframeRef])

  useEffect(() => {
    const id = Math.random().toString(36).slice(2)

    communicator?.send(
      {
        darkMode: isDarkMode,
      },
      id,
    )
  }, [communicator, isDarkMode])

  // Adding communicator logic for the required SDK Methods
  // We don't need to unsubscribe from the events because there can be just one subscription
  // per event type and the next effect run will simply replace the handlers
  useEffect(() => {
    communicator?.on(Methods.getTxBySafeTxHash, (msg) => {
      const { safeTxHash } = msg.data.params as GetTxBySafeTxHashParams

      return handlers.onGetTxBySafeTxHash(safeTxHash)
    })

    communicator?.on(Methods.getEnvironmentInfo, handlers.onGetEnvironmentInfo)

    communicator?.on(Methods.getSafeInfo, handlers.onGetSafeInfo)

    communicator?.on(Methods.getSafeBalances, (msg) => {
      const { currency = 'usd' } = msg.data.params as GetBalanceParams

      return handlers.onGetSafeBalances(currency)
    })

    communicator?.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload

      if (params.call === RPC_CALLS.safe_setSettings) {
        const settings = params.params[0] as SafeSettings
        return handlers.onSetSafeSettings(settings)
      }

      if (!safeAppWeb3Provider) {
        throw new Error('SafeAppWeb3Provider is not initialized')
      }

      try {
        return await safeAppWeb3Provider.send(params.call, params.params)
      } catch (err) {
        throw new Error((err as JsonRpcResponse).error)
      }
    })

    communicator?.on(Methods.sendTransactions, (msg) => {
      const { txs, params } = msg.data.params as SendTransactionsParams

      const transactions = txs.map(({ to, value, data }) => {
        return {
          to: getAddress(to),
          value: value ? BigInt(value).toString() : '0',
          data: data || '0x',
        }
      })

      handlers.onConfirmTransactions(transactions, msg.data.id, params)
    })

    communicator?.on(Methods.signMessage, (msg) => {
      const { message } = msg.data.params as SignMessageParams
      const sdkVersion = msg.data.env.sdkVersion
      handlers.onSignMessage(message, msg.data.id, Methods.signMessage, sdkVersion)
    })

    communicator?.on(Methods.getOffChainSignature, (msg) => {
      return handlers.onGetOffChainSignature(msg.data.params as string)
    })

    communicator?.on(Methods.signTypedMessage, (msg) => {
      const { typedData } = msg.data.params as SignTypedMessageParams
      const sdkVersion = msg.data.env.sdkVersion
      handlers.onSignMessage(typedData, msg.data.id, Methods.signTypedMessage, sdkVersion)
    })

    communicator?.on(Methods.getChainInfo, handlers.onGetChainInfo)

    communicator?.on(Methods.wallet_getPermissions, (msg) => {
      return handlers.onGetPermissions(msg.origin)
    })

    communicator?.on(Methods.wallet_requestPermissions, (msg) => {
      handlers.onSetPermissions({
        origin: msg.origin,
        request: msg.data.params as PermissionRequest[],
        requestId: msg.data.id,
      })
    })

    communicator?.on(Methods.requestAddressBook, (msg) => {
      return handlers.onRequestAddressBook(msg.origin)
    })

    // TODO: it will be moved to safe-apps-sdk soon
    communicator?.on('getCurrentTheme' as Methods, (msg) => {
      communicator.send(
        {
          darkMode: isDarkMode,
        },
        msg.data.id,
      )
    })
  }, [safeAppWeb3Provider, handlers, chain, communicator, isDarkMode, shouldUseSafenetRpc])

  return communicator
}

export default useAppCommunicator
