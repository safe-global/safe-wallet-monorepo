import { type Eip1193Provider, getAddress, type JsonRpcProvider } from 'ethers'
import { SafeWalletProvider, type WalletSDK } from '@/services/safe-wallet-provider'
import { getTransactionDetails, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type NextRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import proposeTx from '@/services/tx/proposeTransaction'
import { isSmartContractWallet } from '@/utils/wallets'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { initSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { tryOffChainTxSigning } from '@/services/tx/tx-sender/sdk'
import type { TransactionResult } from '@safe-global/safe-core-sdk-types'

export type NestedWallet = {
  address: string
  chainId: string
  provider: Eip1193Provider | null
  isSafe: true
}

export const getNestedWallet = (
  actualWallet: ConnectedWallet,
  safeInfo: SafeInfo,
  web3ReadOnly: JsonRpcProvider,
  router: NextRouter,
): NestedWallet => {
  let requestId = 0
  const nestedSafeSdk: WalletSDK = {
    getBySafeTxHash(safeTxHash) {
      return getTransactionDetails(safeInfo.chainId, safeTxHash)
    },
    async switchChain() {
      return Promise.reject('Switching chains is not supported yet')
    },
    getCreateCallTransaction() {
      throw new Error('Unsupported method')
    },

    async signMessage(): Promise<{ signature: string }> {
      return Promise.reject('signMessage is not supported yet')
    },

    async proxy(method, params) {
      return web3ReadOnly?.send(method, params ?? [])
    },

    async send(params) {
      const safeCoreSDK = await initSafeSDK({
        provider: web3ReadOnly,
        chainId: safeInfo.chainId,
        address: safeInfo.address.value,
        version: safeInfo.version,
        implementationVersionState: safeInfo.implementationVersionState,
        implementation: safeInfo.implementation.value,
      })

      const connectedSDK = await safeCoreSDK?.connect({ provider: actualWallet.provider })

      if (!connectedSDK) {
        return Promise.reject('Could not initialize core sdk')
      }

      const transactions = params.txs.map(({ to, value, data }: any) => {
        return {
          to: getAddress(to),
          value: BigInt(value).toString(),
          data,
          operation: 0,
        }
      })

      const safeTx = await connectedSDK.createTransaction({
        transactions,
        onlyCalls: true,
      })

      const safeTxHash = await connectedSDK.getTransactionHash(safeTx)

      let result: TransactionResult | null = null

      try {
        if (await isSmartContractWallet(safeInfo.chainId, actualWallet.address)) {
          // With the unchecked signer, the contract call resolves once the tx
          // has been submitted in the wallet not when it has been executed

          // First we propose so the backend will pick it up
          await proposeTx(safeInfo.chainId, safeInfo.address.value, actualWallet.address, safeTx, safeTxHash)
          result = await connectedSDK.approveTransactionHash(safeTxHash)
        } else {
          // Sign off-chain
          if (safeInfo.threshold === 1) {
            // Always propose the tx so the resulting link to the parentTx does not error out
            await proposeTx(safeInfo.chainId, safeInfo.address.value, actualWallet.address, safeTx, safeTxHash)

            // Directly execute the tx
            result = await connectedSDK.executeTransaction(safeTx)
          } else {
            const signedTx = await tryOffChainTxSigning(safeTx, connectedSDK)
            await proposeTx(safeInfo.chainId, safeInfo.address.value, actualWallet.address, signedTx, safeTxHash)
          }
        }
      } catch (err) {
        logError(ErrorCodes._817, err)
        throw err
      }

      return {
        safeTxHash,
        txHash: result?.hash,
      }
    },

    setSafeSettings() {
      throw new Error('setSafeSettings is not supported yet')
    },

    showTxStatus(safeTxHash) {
      router.push({
        pathname: AppRoutes.transactions.tx,
        query: {
          safe: router.query.safe,
          id: safeTxHash,
        },
      })
    },

    async signTypedMessage() {
      return Promise.reject('signTypedMessage is not supported yet')
    },
  }

  const nestedSafeProvider = new SafeWalletProvider(
    {
      chainId: Number(safeInfo.chainId),
      safeAddress: safeInfo.address.value,
    },
    nestedSafeSdk,
  )

  return {
    provider: {
      async request(request) {
        const result = await nestedSafeProvider.request(requestId++, request, {
          url: '',
          description: '',
          iconUrl: '',
          name: 'Nested Safe',
        })

        if ('result' in result) {
          return result.result
        }

        if ('error' in result) {
          throw new Error(result.error.message)
        }
      },
    },
    address: safeInfo.address.value,
    chainId: safeInfo.chainId,
    isSafe: true,
  }
}
