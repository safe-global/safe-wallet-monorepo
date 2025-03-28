import { useState, useEffect, useContext, type MutableRefObject } from 'react'
import type { UseAppCommunicatorHandlers } from '@/components/safe-apps/AppFrame/useAppCommunicator'
import useAppCommunicator, { CommunicatorMessages } from '@/components/safe-apps/AppFrame/useAppCommunicator'
import type { Methods } from '@safe-global/safe-apps-sdk'
import {
  type BaseTransaction,
  type EIP712TypedData,
  type RequestId,
  type SafeSettings,
  type SendTransactionRequestParams,
} from '@safe-global/safe-apps-sdk'
import { SafeAppsTxFlow, SignMessageFlow, SignMessageOnChainFlow } from '@/components/tx-flow/flows'
import { isOffchainEIP1271Supported } from '@/utils/safe-messages'
import {
  getBalances,
  getSafeMessage,
  getTransactionDetails,
  type SafeAppData,
} from '@safe-global/safe-gateway-typescript-sdk'
import useGetSafeInfo from '@/components/safe-apps/AppFrame/useGetSafeInfo'
import { FEATURES, hasFeature } from '@/utils/chains'
import { isSafeMessageListItem } from '@/utils/safe-message-guards'
import { TxModalContext } from '@/components/tx-flow'
import { selectOnChainSigning, selectTokenList, TOKEN_LISTS } from '@/store/settingsSlice'
import { useAppSelector } from '@/store'
import useSafeInfo from '@/hooks/useSafeInfo'
import { selectSafeMessages } from '@/store/safeMessagesSlice'
import { trackSafeAppEvent, SAFE_APPS_EVENTS } from '@/services/analytics'
import { safeMsgSubscribe, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { txSubscribe, TxEvent } from '@/services/tx/txEvents'
import type { ChainInfo as WebCoreChainInfo } from '@safe-global/safe-gateway-typescript-sdk/dist/types/chains'
import useChainId from '@/hooks/useChainId'
import type AppCommunicator from '@/services/safe-apps/AppCommunicator'
import useBalances from '@/hooks/useBalances'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

export const useCustomAppCommunicator = (
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  app: SafeAppData,
  chain: WebCoreChainInfo | undefined,
  overrideHandlers?: Partial<UseAppCommunicatorHandlers>,
): AppCommunicator | undefined => {
  const [currentRequestId, setCurrentRequestId] = useState<RequestId | undefined>()
  const safeMessages = useAppSelector(selectSafeMessages)
  const { setTxFlow } = useContext(TxModalContext)
  const { safe, safeAddress } = useSafeInfo()
  const onChainSigning = useAppSelector(selectOnChainSigning)
  const [settings, setSettings] = useState<SafeSettings>({
    offChainSigning: true,
  })
  const appData = app
  const onTxFlowClose = () => {
    setCurrentRequestId((prevId) => {
      if (prevId) {
        communicator?.send(CommunicatorMessages.REJECT_TRANSACTION_MESSAGE, prevId, true)
        trackSafeAppEvent(SAFE_APPS_EVENTS.PROPOSE_TRANSACTION_REJECTED, app.name)
      }
      return undefined
    })
  }
  const tokenlist = useAppSelector(selectTokenList)
  const chainId = useChainId()
  const { balances } = useBalances()

  const communicator = useAppCommunicator(iframeRef, appData, chain, {
    onConfirmTransactions: (txs: BaseTransaction[], requestId: RequestId, params?: SendTransactionRequestParams) => {
      const data = {
        app: appData,
        appId: appData ? String(appData.id) : undefined,
        requestId,
        txs,
        params,
      }

      setCurrentRequestId(requestId)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_TRANSACTION_MODAL, label: appData.name })
      setTxFlow(<SafeAppsTxFlow data={data} />, onTxFlowClose)
    },
    onSignMessage: (
      message: string | EIP712TypedData,
      requestId: string,
      method: Methods.signMessage | Methods.signTypedMessage,
      sdkVersion: string,
    ) => {
      const isOffChainSigningSupported = isOffchainEIP1271Supported(safe, chain, sdkVersion)
      const signOffChain = isOffChainSigningSupported && !onChainSigning && !!settings.offChainSigning

      setCurrentRequestId(requestId)

      if (signOffChain) {
        setTxFlow(
          <SignMessageFlow
            logoUri={appData?.iconUrl || ''}
            name={appData?.name || ''}
            message={message as string | TypedData}
            origin={appData?.url}
            requestId={requestId}
          />,
          onTxFlowClose,
        )
      } else {
        setTxFlow(
          <SignMessageOnChainFlow
            props={{
              app: appData,
              requestId,
              message,
              method,
            }}
          />,
        )
      }
    },
    onGetPermissions: () => [],
    onSetPermissions: () => {},
    onRequestAddressBook: () => [],
    onGetTxBySafeTxHash: (safeTxHash) => getTransactionDetails(chainId, safeTxHash),
    onGetEnvironmentInfo: () => ({
      origin: document.location.origin,
    }),
    onGetSafeInfo: useGetSafeInfo(),
    onGetSafeBalances: (currency) => {
      const isDefaultTokenlistSupported = chain && hasFeature(chain, FEATURES.DEFAULT_TOKENLIST)

      return safe.deployed
        ? getBalances(chainId, safeAddress, currency, {
            exclude_spam: true,
            trusted: isDefaultTokenlistSupported && TOKEN_LISTS.TRUSTED === tokenlist,
          })
        : Promise.resolve(balances)
    },
    onGetChainInfo: () => {
      if (!chain) return

      const { nativeCurrency, chainName, chainId, shortName, blockExplorerUriTemplate } = chain

      return {
        chainName,
        chainId,
        shortName,
        nativeCurrency,
        blockExplorerUriTemplate,
      }
    },
    onSetSafeSettings: (safeSettings: SafeSettings) => {
      const newSettings: SafeSettings = {
        ...settings,
        offChainSigning: !!safeSettings.offChainSigning,
      }

      setSettings(newSettings)

      return newSettings
    },
    onGetOffChainSignature: async (messageHash: string) => {
      const safeMessage = safeMessages.data?.results
        ?.filter(isSafeMessageListItem)
        ?.find((item) => item.messageHash === messageHash)

      if (safeMessage) {
        return safeMessage.preparedSignature || undefined
      }

      try {
        const { preparedSignature } = await getSafeMessage(chainId, messageHash)
        return preparedSignature || undefined
      } catch {
        return undefined
      }
    },
    ...overrideHandlers,
  })

  useEffect(() => {
    const unsubscribe = txSubscribe(TxEvent.SAFE_APPS_REQUEST, async ({ safeAppRequestId, safeTxHash }) => {
      if (safeAppRequestId && currentRequestId === safeAppRequestId) {
        trackSafeAppEvent(SAFE_APPS_EVENTS.PROPOSE_TRANSACTION, appData?.name)
        communicator?.send({ safeTxHash }, safeAppRequestId)
      }
    })

    return unsubscribe
  }, [chainId, communicator, currentRequestId, appData.name])

  useEffect(() => {
    const unsubscribe = safeMsgSubscribe(SafeMsgEvent.SIGNATURE_PREPARED, ({ messageHash, requestId, signature }) => {
      if (requestId && currentRequestId === requestId) {
        communicator?.send({ messageHash, signature }, requestId)
      }
    })

    return unsubscribe
  }, [communicator, currentRequestId])

  return communicator
}
