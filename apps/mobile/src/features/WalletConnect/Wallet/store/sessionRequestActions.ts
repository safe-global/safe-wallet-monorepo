import { router } from 'expo-router'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import type { AppDispatch, RootState } from '@/src/store'
import { selectActiveSafe, switchActiveChain } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { proxyReadOnlyCall } from '../services/readRpcProxy'
import { buildGetCallsResult, type GetCallsResult, type RawTxReceipt } from '../services/getCallsStatus'
import { logWalletKitError } from '../utils/errors'

type GetState = () => RootState

// switchActiveChain re-syncs the WC sessions via the safe-switch listener, so no explicit updateSession.
export const makeSwitchActiveChainByCaip2 =
  (getState: GetState, dispatch: AppDispatch) =>
  async (caip2: string): Promise<{ ok: true } | { ok: false; reason: 'NOT_DEPLOYED' }> => {
    const chainId = stripEip155Prefix(caip2)
    const current = getState()
    if (!selectChainById(current, chainId)) {
      return { ok: false, reason: 'NOT_DEPLOYED' }
    }
    const safeAddress = selectActiveSafe(current)?.address
    const safeChains = safeAddress ? Object.keys(current.safes[safeAddress] ?? {}) : []
    if (!safeChains.includes(chainId)) {
      return { ok: false, reason: 'NOT_DEPLOYED' }
    }
    dispatch(switchActiveChain({ chainId }))
    return { ok: true }
  }

export const makeGetCallsStatus =
  (getState: GetState, dispatch: AppDispatch) =>
  async (chainId: string, id: string): Promise<GetCallsResult> => {
    const numericChainId = stripEip155Prefix(chainId)

    let tx
    try {
      tx = await dispatch(
        cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId: numericChainId, id }),
      ).unwrap()
    } catch {
      throw new Error('Transaction not found')
    }

    let receipt: RawTxReceipt | null = null
    if (tx.txHash) {
      const chain = selectChainById(getState(), numericChainId)
      if (chain) {
        try {
          receipt = (await proxyReadOnlyCall(chain, 'eth_getTransactionReceipt', [tx.txHash])) as RawTxReceipt | null
        } catch (e) {
          logWalletKitError('getCallsStatus receipt fetch failed', e)
          receipt = null
        }
      } else {
        logWalletKitError('getCallsStatus: no chain config for receipt lookup', new Error(`chainId=${numericChainId}`))
      }
    }

    return buildGetCallsResult(id, numericChainId, tx, receipt)
  }

export const navigateToCallsStatus = (chainId: string, id: string): void => {
  router.push({ pathname: '/pending-transactions', params: { chainId, txId: id } })
}
