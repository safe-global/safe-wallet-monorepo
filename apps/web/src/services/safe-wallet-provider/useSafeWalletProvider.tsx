import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import { RpcErrorCode } from '.'
import type { AppInfo, WalletSDK } from '.'
import { SafeWalletProvider } from '.'
import useSafeInfo from '@/hooks/useSafeInfo'
import { TxModalContext } from '@/components/tx-flow'
import { SignMessageFlow } from '@/components/tx-flow/flows'
import { safeMsgSubscribe, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { SafeAppsTxFlow } from '@/components/tx-flow/flows'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { Methods } from '@safe-global/safe-apps-sdk'
import type { SafeSettings } from '@safe-global/safe-apps-sdk'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Interface, getAddress } from 'ethers'
import { AppRoutes } from '@/config/routes'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import { NotificationMessages, showNotification } from './notifications'
import { SignMessageOnChainFlow } from '@/components/tx-flow/flows'
import { useAppSelector } from '@/store'
import { selectOnChainSigning } from '@/store/settingsSlice'
import { isOffchainEIP1271Supported } from '@safe-global/utils/utils/safe-messages'
import { getCreateCallContractDeployment } from '@safe-global/utils/services/contracts/deployments'

export const useTxFlowApi = (chainId: string, safeAddress: string): WalletSDK | undefined => {
  const { safe } = useSafeInfo()
  const currentChain = useCurrentChain()
  const { setTxFlow } = useContext(TxModalContext)
  const web3ReadOnly = useWeb3ReadOnly()
  const router = useRouter()
  const { configs } = useChains()
  const pendingTxs = useRef<Record<string, string>>({})

  const onChainSigning = useAppSelector(selectOnChainSigning)
  const [settings, setSettings] = useState<SafeSettings>({
    offChainSigning: true,
  })

  useEffect(() => {
    const unsubscribe = txSubscribe(TxEvent.PROCESSING, async ({ txId, txHash }) => {
      if (!txId) return
      pendingTxs.current[txId] = txHash
    })
    return unsubscribe
  }, [])

  return useMemo<WalletSDK | undefined>(() => {
    if (!chainId || !safeAddress) return

    const signMessage = (
      message: string | TypedData,
      appInfo: AppInfo,
      method: Methods.signMessage | Methods.signTypedMessage,
    ): Promise<{ signature: string }> => {
      const id = Math.random().toString(36).slice(2)
      const shouldSignOffChain =
        isOffchainEIP1271Supported(safe, currentChain) && !onChainSigning && settings.offChainSigning

      const { title, options } = NotificationMessages.SIGNATURE_REQUEST(appInfo)
      showNotification(title, options)

      return new Promise((resolve, reject) => {
        let onClose = () => {
          reject({
            code: RpcErrorCode.USER_REJECTED,
            message: 'User rejected signature',
          })
          unsubscribe()
        }

        const unsubscribeSignaturePrepared = safeMsgSubscribe(
          SafeMsgEvent.SIGNATURE_PREPARED,
          ({ requestId, signature }) => {
            if (requestId === id) {
              resolve({ signature })
              unsubscribe()
            }
          },
        )

        const unsubscribe = () => {
          onClose = () => {}
          unsubscribeSignaturePrepared()
        }

        if (shouldSignOffChain) {
          setTxFlow(
            <SignMessageFlow
              logoUri={appInfo.iconUrl}
              name={appInfo.name}
              origin={appInfo.url}
              message={message}
              requestId={id}
            />,
            onClose,
          )
        } else {
          setTxFlow(<SignMessageOnChainFlow props={{ requestId: id, message, method }} />, onClose)
        }
      })
    }

    return {
      async signMessage(message, appInfo) {
        return await signMessage(message, appInfo, Methods.signMessage)
      },

      async signTypedMessage(typedData, appInfo) {
        return await signMessage(typedData as TypedData, appInfo, Methods.signTypedMessage)
      },

      async send(params: { txs: any[]; params: { safeTxGas: number } }, appInfo) {
        const id = Math.random().toString(36).slice(2)

        const transactions = params.txs.map(({ to, value, data }) => {
          return {
            to: getAddress(to),
            value: BigInt(value).toString(),
            data,
          }
        })

        const { title, options } = NotificationMessages.TRANSACTION_REQUEST(appInfo)
        showNotification(title, options)

        return new Promise((resolve, reject) => {
          let onClose = () => {
            reject({
              code: RpcErrorCode.USER_REJECTED,
              message: 'User rejected transaction',
            })
          }

          const onSubmit = (txId: string, safeTxHash: string) => {
            const txHash = pendingTxs.current[txId]
            onClose = () => {}
            resolve({ safeTxHash, txHash })
          }

          setTxFlow(
            <SafeAppsTxFlow
              data={{
                appId: undefined,
                app: appInfo,
                requestId: id,
                txs: transactions,
                params: params.params,
              }}
              onSubmit={onSubmit}
            />,
            onClose,
          )
        })
      },

      async getBySafeTxHash(safeTxHash) {
        return getTransactionDetails(chainId, safeTxHash)
      },

      async switchChain(hexChainId, appInfo) {
        const decimalChainId = parseInt(hexChainId, 16).toString()
        if (decimalChainId === chainId) {
          return null
        }

        const cfg = configs.find((c) => c.chainId === chainId)
        if (!cfg) {
          throw new Error(`Chain ${chainId} not supported`)
        }

        if (confirm(`${appInfo.name} wants to switch to ${cfg.shortName}. Do you want to continue?`)) {
          router.push({
            pathname: AppRoutes.index,
            query: {
              chain: cfg.shortName,
            },
          })
        }

        return null
      },

      async showTxStatus(safeTxHash) {
        router.push({
          pathname: AppRoutes.transactions.tx,
          query: {
            safe: router.query.safe,
            id: safeTxHash,
          },
        })
      },

      setSafeSettings(newSettings) {
        const res = {
          ...settings,
          ...newSettings,
        }

        setSettings(newSettings)

        return res
      },

      async proxy(method, params) {
        return web3ReadOnly?.send(method, params ?? [])
      },

      getCreateCallTransaction(data) {
        const createCallDeployment = currentChain
          ? getCreateCallContractDeployment(currentChain, safe.version)
          : undefined
        if (!createCallDeployment) {
          throw new Error('No CreateCall deployment found for chain and safe version')
        }
        const createCallAddress = createCallDeployment.networkAddresses[safe.chainId]

        const createCallInterface = new Interface(createCallDeployment.abi)
        const callData = createCallInterface.encodeFunctionData('performCreate', ['0', data])

        return {
          to: createCallAddress,
          data: callData,
          value: '0',
        }
      },
    }
  }, [chainId, safeAddress, safe, currentChain, onChainSigning, settings, setTxFlow, configs, router, web3ReadOnly])
}

const useSafeWalletProvider = (): SafeWalletProvider | undefined => {
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe

  const txFlowApi = useTxFlowApi(chainId, safeAddress)

  return useMemo(() => {
    if (!safeAddress || !chainId || !txFlowApi) return

    return new SafeWalletProvider(
      {
        safeAddress,
        chainId: Number(chainId),
      },
      txFlowApi,
    )
  }, [safeAddress, chainId, txFlowApi])
}

export default useSafeWalletProvider
