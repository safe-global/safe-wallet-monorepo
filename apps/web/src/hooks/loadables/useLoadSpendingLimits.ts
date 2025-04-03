import { useEffect } from 'react'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { JsonRpcProvider } from 'ethers'
import { getSpendingLimitContract } from '@/services/contracts/spendingLimitContracts'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { type AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type AllowanceModule } from '@safe-global/utils/types/contracts'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'

import { sameString } from '@safe-global/protocol-kit/dist/src/utils'
import { useAppSelector } from '@/store'
import { selectTokens } from '@/store/balancesSlice'
import isEqual from 'lodash/isEqual'

const DEFAULT_TOKEN_INFO = {
  decimals: 18,
  symbol: '',
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
  safeModules: AddressInfo[],
  safeAddress: string,
  chainId: string,
  tokenInfoFromBalances: TokenInfo[],
): Promise<SpendingLimitState[] | undefined> => {
  let contract: ReturnType<typeof getSpendingLimitContract>
  try {
    contract = getSpendingLimitContract(chainId, safeModules, provider)
  } catch {
    return
  }
  const delegates = await contract.getDelegates(safeAddress, 0, 100)

  const spendingLimits = await Promise.all(
    delegates.results.map(async (delegate) =>
      getTokensForDelegate(contract, safeAddress, delegate, tokenInfoFromBalances),
    ),
  )
  return spendingLimits.flat().filter(discardZeroAllowance)
}

export const useLoadSpendingLimits = (): AsyncResult<SpendingLimitState[]> => {
  const { safeAddress, safe, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const tokenInfoFromBalances = useAppSelector(selectTokens, isEqual)

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
