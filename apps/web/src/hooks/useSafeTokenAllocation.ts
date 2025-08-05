import { getSafeTokenAddress, getSafeLockingAddress } from '@/components/common/SafeTokenWidget'
import { IS_PRODUCTION } from '@/config/constants'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { AbiCoder, Interface } from 'ethers'
import { useMemo } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from './useSafeInfo'
import { getWeb3ReadOnly } from './wallets/web3'
import { cgwDebugStorage } from '@/config/gateway'
import { multicall } from '../../../../packages/utils/src/utils/multicall'

export const VESTING_URL =
  IS_PRODUCTION || cgwDebugStorage.get()
    ? 'https://safe-claiming-app-data.safe.global/allocations/'
    : 'https://safe-claiming-app-data.staging.5afe.dev/allocations/'

export type VestingData = {
  tag: 'user' | 'ecosystem' | 'investor' | 'user_v2' | 'sap_boosted' | 'sap_unboosted' // SEP #5
  account: string
  chainId: number
  contract: string
  vestingId: string
  durationWeeks: number
  startDate: number
  amount: string
  curve: 0 | 1
  proof: string[]
}

export type Vesting = VestingData & {
  isExpired: boolean
  isRedeemed: boolean
  amountClaimed: string
}

// We currently do not have typechain as dependency so we fallback to human readable ABIs
const airdropInterface = new Interface([
  'function redeemDeadline() public returns (uint64)',
  'function vestings(bytes32) public returns (address account, uint8 curveType,bool managed, uint16 durationWeeks, uint64 startDate, uint128 amount, uint128 amountClaimed, uint64 pausingDate,bool cancelled)',
])
const tokenInterface = new Interface(['function balanceOf(address _owner) public view returns (uint256 balance)'])
const safeLockingInterface = new Interface([
  'function getUserTokenBalance(address holder) external view returns (uint96 amount)',
])
/**
 * Add on-chain information to allocation.
 * Fetches if the redeem deadline is expired and the claimed tokens from on-chain
 */
const completeAllocations = async (allocations: VestingData[]): Promise<Vesting[]> => {
  const web3ReadOnly = getWeb3ReadOnly()
  if (!web3ReadOnly) {
    throw new Error('Cannot fetch vestings without web3 provider')
  }

  const calls = allocations.map((allocation) => ({
    to: allocation.contract,
    data: airdropInterface.encodeFunctionData('vestings', [allocation.vestingId]),
  }))
  const results = await multicall(web3ReadOnly, calls)

  return allocations.map((allocation, index) => {
    const result = results[index]
    if (!result.success) {
      throw new Error(`Failed to fetch vesting data for ${allocation.vestingId}`)
    }

    const decodedVestingData = AbiCoder.defaultAbiCoder().decode(
      // account, curveType, managed, durationWeeks, startDate, amount, amountClaimed, pausingDate, cancelled}
      ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
      result.returnData,
    )

    const isRedeemed = decodedVestingData[0].toLowerCase() !== ZERO_ADDRESS.toLowerCase()
    if (isRedeemed) {
      return { ...allocation, isRedeemed, isExpired: false, amountClaimed: decodedVestingData[6] }
    }

    // All allocations are expired by now. We do not load the redeem deadline anymore
    return { ...allocation, isRedeemed, isExpired: true, amountClaimed: '0' }
  })
}

const fetchAllocation = async (chainId: string, safeAddress: string): Promise<VestingData[]> => {
  try {
    const response = await fetch(`${VESTING_URL}${chainId}/${safeAddress}.json`)

    // No file exists => the safe is not part of any vesting
    if (response.status === 404) {
      return Promise.resolve([]) as Promise<VestingData[]>
    }

    // Some other error
    if (!response.ok) {
      throw Error(`Error fetching vestings: ${response.statusText}`)
    }

    // Success
    return response.json() as Promise<VestingData[]>
  } catch (err) {
    throw Error(`Error fetching vestings: ${err}`)
  }
}

const useSafeTokenAllocation = (): AsyncResult<Vesting[]> => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  return useAsync<Vesting[] | undefined>(async () => {
    if (!safeAddress) return
    return Promise.all(
      await fetchAllocation(chainId, safeAddress).then((allocations) => completeAllocations(allocations)),
    )
    // If the history tag changes we could have claimed / redeemed tokens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, safeAddress, safe.txHistoryTag])
}

const fetchTokenBalances = async (chainId: string, safeAddress: string): Promise<[bigint, bigint]> => {
  try {
    const web3ReadOnly = getWeb3ReadOnly()
    const safeTokenAddress = getSafeTokenAddress(chainId)
    const safeLockingAddress = getSafeLockingAddress(chainId)

    if (!web3ReadOnly || !safeTokenAddress || !safeLockingAddress) return [BigInt(0), BigInt(0)]

    const calls = [
      {
        to: safeTokenAddress,
        data: tokenInterface.encodeFunctionData('balanceOf', [safeAddress]),
      },
      {
        to: safeLockingAddress,
        data: safeLockingInterface.encodeFunctionData('getUserTokenBalance', [safeAddress]),
      },
    ]

    const [balanceResponse, lockedResponse] = await multicall(web3ReadOnly, calls)

    if (!balanceResponse.success || !lockedResponse.success) {
      throw new Error('Failed to fetch token balances')
    }

    return [BigInt(balanceResponse.returnData), BigInt(lockedResponse.returnData)]
  } catch (err) {
    throw Error(`Error fetching Safe Token balances: ${err}`)
  }
}

/**
 * The Safe token allocation is equal to the voting power.
 * It is computed by adding all vested tokens - claimed tokens + token balance
 */
export const useSafeVotingPower = (allocationData?: Vesting[]): AsyncResult<bigint> => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  const [balance, balanceError, balanceLoading] = useAsync<bigint | undefined>(async () => {
    if (!safeAddress) return
    const [tokenBalance, lockingContractBalance] = await fetchTokenBalances(chainId, safeAddress)
    return tokenBalance + lockingContractBalance
  }, [chainId, safeAddress])

  const allocation = useMemo(() => {
    if (balance === undefined) {
      return
    }

    // Return current balance if no allocation exists
    if (!allocationData) {
      return balance
    }

    const tokensInVesting = allocationData.reduce(
      (acc, data) =>
        data.isExpired || data.tag === 'sap_boosted' || data.tag === 'sap_unboosted' // Exclude the SAP Airdrops from voting power
          ? acc
          : acc + BigInt(data.amount) - BigInt(data.amountClaimed),
      BigInt(0),
    )

    // add balance
    const totalAllocation = tokensInVesting + balance
    return totalAllocation
  }, [allocationData, balance])

  return [allocation, balanceError, balanceLoading]
}

export default useSafeTokenAllocation
