import type { JsonRpcProvider } from 'ethers'
import type { SpendingLimitState } from '../types'
import { getSpendingLimitContract } from './spendingLimitContracts'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { type AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type AllowanceModule } from '@safe-global/utils/types/contracts'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import { multicall } from '@safe-global/utils/utils/multicall'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const DEFAULT_TOKEN_INFO = {
  decimals: 18,
  symbol: '',
}

const discardZeroAllowance = (spendingLimit: SpendingLimitState): boolean =>
  !(spendingLimit.amount === '0' && spendingLimit.resetTimeMin === '0')

const getTokenInfoFromBalances = (
  tokenInfoFromBalances: Balance['tokenInfo'][],
  address: string,
): Balance['tokenInfo'] | undefined => tokenInfoFromBalances.find((token) => token.address === address)

export const getTokenAllowances = async (
  contract: AllowanceModule,
  provider: JsonRpcProvider,
  safeAddress: string,
  allowanceRequests: { delegate: string; token: string }[],
  tokenInfoFromBalances: Balance['tokenInfo'][],
): Promise<SpendingLimitState[]> => {
  const moduleAddress = await contract.getAddress()
  const calls = allowanceRequests.map(({ delegate, token }) => ({
    to: moduleAddress,
    data: contract.interface.encodeFunctionData('getTokenAllowance', [safeAddress, delegate, token]),
  }))
  const results = await multicall(provider, calls)

  // Multicall returns { success, returnData } per call. A reverted sub-call has
  // returnData = '0x', which would crash decodeFunctionResult with "invalid
  // bytes32 - not 32 bytes long". Drop failed entries so one bad delegate/token
  // doesn't take the whole load down.
  type DecodedAllowance = {
    index: number
    tokenAllowance: ReturnType<AllowanceModule['interface']['decodeFunctionResult']>[number]
  }
  const decoded = results
    .map((result, index): DecodedAllowance | null => {
      if (!result.success || !result.returnData || result.returnData === '0x') return null
      try {
        const tokenAllowance = contract.interface.decodeFunctionResult('getTokenAllowance', result.returnData)[0]
        return { index, tokenAllowance }
      } catch {
        return null
      }
    })
    .filter((entry): entry is DecodedAllowance => entry !== null)

  const missingTokenAddresses = decoded
    .map(({ index }) => allowanceRequests[index].token)
    .filter((tokenAddress) => !getTokenInfoFromBalances(tokenInfoFromBalances, tokenAddress))

  const missingTokenInfos = await getERC20TokenInfoOnChain(missingTokenAddresses)

  return decoded.map(({ index, tokenAllowance }) => {
    const { delegate, token } = allowanceRequests[index]
    const [amount, spent, resetTimeMin, lastResetMin, nonce] = tokenAllowance
    return {
      beneficiary: delegate,
      token: getTokenInfoFromBalances(tokenInfoFromBalances, token) ||
        missingTokenInfos?.find((tokenInfo) => sameAddress(tokenInfo.address, token)) || {
          ...DEFAULT_TOKEN_INFO,
          address: token,
        },
      amount: amount.toString(),
      spent: spent.toString(),
      resetTimeMin: resetTimeMin.toString(),
      lastResetMin: lastResetMin.toString(),
      nonce: nonce.toString(),
    }
  })
}

export const getTokensForDelegates = async (
  contract: AllowanceModule,
  provider: JsonRpcProvider,
  safeAddress: string,
  delegates: string[],
  tokenInfoFromBalances: Balance['tokenInfo'][],
) => {
  const allowanceAddress = await contract.getAddress()
  const calls = delegates.map((delegate) => ({
    to: allowanceAddress,
    data: contract.interface.encodeFunctionData('getTokens', [safeAddress, delegate]),
  }))

  const results = await multicall(provider, calls)
  // Same robustness as getTokenAllowances: drop sub-calls that reverted so a
  // bad delegate doesn't take down the whole listing.
  const tokens = results.map((result) => {
    if (!result.success || !result.returnData || result.returnData === '0x') return [] as string[]
    try {
      return contract.interface.decodeFunctionResult('getTokens', result.returnData)[0] as string[]
    } catch {
      return [] as string[]
    }
  })

  const spendingLimitRequests = delegates.flatMap((delegate, idx) => {
    const tokensForDelegate = tokens[idx]
    return tokensForDelegate.map((token) => ({
      delegate,
      token,
    }))
  })

  return getTokenAllowances(contract, provider, safeAddress, spendingLimitRequests, tokenInfoFromBalances)
}

export const loadSpendingLimits = async (
  provider: JsonRpcProvider,
  safeModules: AddressInfo[],
  safeAddress: string,
  chainId: string,
  tokenInfoFromBalances: Balance['tokenInfo'][],
): Promise<SpendingLimitState[] | undefined> => {
  let contract: ReturnType<typeof getSpendingLimitContract>
  try {
    contract = getSpendingLimitContract(chainId, safeModules, provider)
  } catch {
    return
  }
  const delegates = await contract.getDelegates(safeAddress, 0, 100)

  const spendingLimits = await getTokensForDelegates(
    contract,
    provider,
    safeAddress,
    delegates.results,
    tokenInfoFromBalances,
  )

  return spendingLimits.flat().filter(discardZeroAllowance)
}
