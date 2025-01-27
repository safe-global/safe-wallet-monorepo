import { POLLING_INTERVAL } from '@/config/constants'
import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import { useAppSelector } from '@/store'
import { getSafenetBalances, useGetSafenetConfigQuery } from '@/store/safenet'
import { TOKEN_LISTS, selectCurrency, selectSettings } from '@/store/settingsSlice'
import { FEATURES, hasFeature } from '@/utils/chains'
import { convertSafenetBalanceToSafeClientGatewayBalance } from '@/utils/safenet'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { getBalances, type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { useEffect, useMemo } from 'react'
import useAsync, { type AsyncResult } from '../useAsync'
import { useCurrentChain } from '../useChains'
import useIntervalCounter from '../useIntervalCounter'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import useSafeInfo from '../useSafeInfo'

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

const mergeBalances = (cgw: SafeBalanceResponse, sn: SafeBalanceResponse): SafeBalanceResponse => {
  // Create a Map using token addresses as keys
  const uniqueBalances = new Map(
    // Process Safenet items last so they take precedence by overwriting the CGW items
    [...cgw.items, ...sn.items].map((item) => [item.tokenInfo.address, item]),
  )

  return {
    // We do not sum the fiatTotal as Safenet doesn't return it
    // And if it did, we would have to do something fancy with calculations so balances aren't double counted
    fiatTotal: Array.from(uniqueBalances.values())
      .reduce((acc, item) => acc + parseFloat(item.fiatBalance), 0)
      .toString(),
    items: Array.from(uniqueBalances.values()),
  }
}

export const useLoadBalances = (): AsyncResult<SafeBalanceResponse> => {
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const isSafenetEnabled = useIsSafenetEnabled()
  const {
    data: safenetConfig,
    isSuccess: isSafenetConfigSuccess,
    isLoading: isSafenetConfigLoading,
  } = useGetSafenetConfigQuery(!isSafenetEnabled ? skipToken : undefined)
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const chainId = safe.chainId
  const chainSupportedBySafenet = isSafenetConfigSuccess && safenetConfig.chains.includes(Number(chainId))

  // Re-fetch assets when the entire SafeInfo updates
  const [data, error, loading] = useAsync<SafeBalanceResponse | undefined>(
    () => {
      if (!chainId || !safeAddress || isTrustedTokenList === undefined || isSafenetConfigLoading) return

      if (!safe.deployed) {
        return getCounterfactualBalance(safeAddress, web3, chain)
      }

      const balanceQueries = [
        getBalances(chainId, safeAddress, currency, {
          trusted: isTrustedTokenList,
        }),
      ]

      if (isSafenetEnabled && isSafenetConfigSuccess && chainSupportedBySafenet) {
        balanceQueries.push(
          getSafenetBalances(safeAddress)
            .then((safenetBalances) =>
              convertSafenetBalanceToSafeClientGatewayBalance(safenetBalances, safenetConfig, Number(chainId)),
            )
            .catch(() => ({
              fiatTotal: '0',
              items: [],
            })),
        )
      }

      return Promise.all(balanceQueries).then(([cgw, sn]) => (sn ? mergeBalances(cgw, sn) : cgw))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      safeAddress,
      chainId,
      currency,
      isTrustedTokenList,
      pollCount,
      safe.deployed,
      web3,
      chain,
      safenetConfig,
      isSafenetConfigSuccess,
      isSafenetConfigLoading,
      chainSupportedBySafenet,
    ],
    false, // don't clear data between polls
  )
  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, safeAddress, chainId])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._601, error.message)
    }
  }, [error])

  return [data, error, loading || isSafenetConfigLoading]
}

export default useLoadBalances
