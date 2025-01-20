import { useEffect } from 'react'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { JsonRpcProvider } from 'ethers'
import { getSpendingLimitContract, getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import type { AddressEx, SafeBalanceResponse, TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@/utils/addresses'
import { type AllowanceModule } from '@/types/contracts'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'

import { sameString } from '@safe-global/protocol-kit/dist/src/utils'
import useBalances from '../useBalances'

const DEFAULT_TOKEN_INFO = {
  decimals: 18,
  symbol: '',
}

const isModuleEnabled = (modules: string[], moduleAddress: string): boolean => {
  return modules?.some((module) => sameAddress(module, moduleAddress)) ?? false
}

const discardZeroAllowance = (spendingLimit: SpendingLimitState): boolean =>
  !(sameString(spendingLimit.amount, '0') && sameString(spendingLimit.resetTimeMin, '0'))

const getTokenInfoFromBalances = (tokenInfoFromBalances: TokenInfo[], address: string): TokenInfo | undefined =>
  tokenInfoFromBalances.find((token) => token.address === address)

export const getTokenAllowanceForDelegate = async (
  contract: AllowanceModule,
  safeAddress: string,
  delegate: string,
  token: string,
  tokenInfoFromBalances: TokenInfo[],
): Promise<SpendingLimitState> => {
  const tokenAllowance = await contract.getTokenAllowance(safeAddress, delegate, token)
  const [amount, spent, resetTimeMin, lastResetMin, nonce] = tokenAllowance
  return {
    beneficiary: delegate,
    token: getTokenInfoFromBalances(tokenInfoFromBalances, token) ||
      (await getERC20TokenInfoOnChain(token)) || { ...DEFAULT_TOKEN_INFO, address: token },
    amount: amount.toString(),
    spent: spent.toString(),
    resetTimeMin: resetTimeMin.toString(),
    lastResetMin: lastResetMin.toString(),
    nonce: nonce.toString(),
  }
}

export const getTokensForDelegate = async (
  contract: AllowanceModule,
  safeAddress: string,
  delegate: string,
  tokenInfoFromBalances: TokenInfo[],
) => {
  const tokens = await contract.getTokens(safeAddress, delegate)

  return Promise.all(
    tokens.map(async (token) =>
      getTokenAllowanceForDelegate(contract, safeAddress, delegate, token, tokenInfoFromBalances),
    ),
  )
}

export const getSpendingLimits = async (
  provider: JsonRpcProvider,
  safeModules: AddressEx[],
  safeAddress: string,
  chainId: string,
  tokenInfoFromBalances: TokenInfo[],
): Promise<SpendingLimitState[] | undefined> => {
  const spendingLimitModuleAddress = getSpendingLimitModuleAddress(chainId)
  if (!spendingLimitModuleAddress) return

  const isSpendingLimitEnabled = isModuleEnabled(
    safeModules.map((module) => module.value),
    spendingLimitModuleAddress,
  )
  if (!isSpendingLimitEnabled) return

  const contract = getSpendingLimitContract(chainId, provider)
  const delegates = await contract.getDelegates(safeAddress, 0, 100)

  const spendingLimits = await Promise.all(
    delegates.results.map(async (delegate) =>
      getTokensForDelegate(contract, safeAddress, delegate, tokenInfoFromBalances),
    ),
  )
  return spendingLimits.flat().filter(discardZeroAllowance)
}

const selectTokens = (balances: SafeBalanceResponse | undefined): TokenInfo[] => {
  if (!balances) return []
  return balances.items.map(({ tokenInfo }) => tokenInfo)
}

export const useLoadSpendingLimits = (): AsyncResult<SpendingLimitState[]> => {
  const { safeAddress, safe, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const { balances } = useBalances()
  const tokenInfoFromBalances = selectTokens(balances)

  const [data, error, loading] = useAsync<SpendingLimitState[] | undefined>(
    () => {
      if (!provider || !safeLoaded || !safe.modules || tokenInfoFromBalances.length === 0) return

      return getSpendingLimits(provider, safe.modules, safeAddress, chainId, tokenInfoFromBalances)
    },
    // Need to check length of modules array to prevent new request every time Safe info polls
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, safeLoaded, safe.modules?.length, tokenInfoFromBalances, safeAddress, chainId, safe.txHistoryTag],
    false,
  )

  useEffect(() => {
    if (error) {
      logError(Errors._609, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadSpendingLimits
