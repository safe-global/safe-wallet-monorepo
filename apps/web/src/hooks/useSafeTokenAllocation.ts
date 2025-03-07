import { getSafeTokenAddress, getSafeLockingAddress } from '@/components/common/SafeTokenWidget'
import { IS_PRODUCTION } from '@/config/constants'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { isPast } from 'date-fns'
import { AbiCoder, Interface, type JsonRpcProvider } from 'ethers'
import { useMemo } from 'react'
import useAsync, { type AsyncResult } from './useAsync'
import useSafeInfo from './useSafeInfo'
import { getWeb3ReadOnly } from './wallets/web3'
import memoize from 'lodash/memoize'
import { cgwDebugStorage } from '@/config/gateway'

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

export const _getRedeemDeadline = memoize(
  async (allocation: VestingData, web3ReadOnly: JsonRpcProvider): Promise<string> => {
    return web3ReadOnly.call({
      to: allocation.contract,
      data: airdropInterface.encodeFunctionData('redeemDeadline'),
    })
  },
  ({ chainId, contract }) => chainId + contract,
)

/**
 * Add on-chain information to allocation.
 * Fetches if the redeem deadline is expired and the claimed tokens from on-chain
 */
const completeAllocation = async (allocation: VestingData): Promise<Vesting> => {
  const web3ReadOnly = getWeb3ReadOnly()
  if (!web3ReadOnly) {
    throw new Error('Cannot fetch vesting without web3 provider')
  }
  const onChainVestingData = await web3ReadOnly.call({
    to: allocation.contract,
    data: airdropInterface.encodeFunctionData('vestings', [allocation.vestingId]),
  })

  const decodedVestingData = AbiCoder.defaultAbiCoder().decode(
    // account, curveType, managed, durationWeeks, startDate, amount, amountClaimed, pausingDate, cancelled}
    ['address', 'uint8', 'bool', 'uint16', 'uint64', 'uint128', 'uint128', 'uint64', 'bool'],
    onChainVestingData,
  )

  const isRedeemed = decodedVestingData[0].toLowerCase() !== ZERO_ADDRESS.toLowerCase()
  if (isRedeemed) {
    return { ...allocation, isRedeemed, isExpired: false, amountClaimed: decodedVestingData[6] }
  }

  // Allocation is not yet redeemed => check the redeemDeadline
  const redeemDeadline = await _getRedeemDeadline(allocation, web3ReadOnly)

  const redeemDeadlineDate = new Date(Number(BigInt(redeemDeadline) * BigInt(1000)))

  // Allocation is valid if redeem deadline is in future
  return { ...allocation, isRedeemed, isExpired: isPast(redeemDeadlineDate), amountClaimed: '0' }
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
      await fetchAllocation(chainId, safeAddress).then((allocations) =>
        allocations.map((allocation) => completeAllocation(allocation)),
      ),
    )
    // If the history tag changes we could have claimed / redeemed tokens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, safeAddress, safe.txHistoryTag])
}

const fetchTokenBalance = async (chainId: string, safeAddress: string): Promise<string> => {
  try {
    const web3ReadOnly = getWeb3ReadOnly()
    const safeTokenAddress = getSafeTokenAddress(chainId)
    if (!safeTokenAddress || !web3ReadOnly) return '0'

    return await web3ReadOnly.call({
      to: safeTokenAddress,
      data: tokenInterface.encodeFunctionData('balanceOf', [safeAddress]),
    })
  } catch (err) {
    throw Error(`Error fetching Safe Token balance:  ${err}`)
  }
}
const fetchLockingContractBalance = async (chainId: string, safeAddress: string): Promise<string> => {
  try {
    const web3ReadOnly = getWeb3ReadOnly()
    const safeLockingAddress = getSafeLockingAddress(chainId)
    if (!safeLockingAddress || !web3ReadOnly) return '0'

    return await web3ReadOnly.call({
      to: safeLockingAddress,
      data: safeLockingInterface.encodeFunctionData('getUserTokenBalance', [safeAddress]),
    })
  } catch (err) {
    throw Error(`Error fetching Safe Token balance in locking contract:  ${err}`)
  }
}

/**
 * The Safe token allocation is equal to the voting power.
 * It is computed by adding all vested tokens - claimed tokens + token balance
 */
export const useSafeVotingPower = (allocationData?: Vesting[]): AsyncResult<bigint> => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe.chainId

  const [balance, balanceError, balanceLoading] = useAsync<bigint>(() => {
    if (!safeAddress) return
    const tokenBalancePromise = fetchTokenBalance(chainId, safeAddress)
    const lockingContractBalancePromise = fetchLockingContractBalance(chainId, safeAddress)
    return Promise.all([tokenBalancePromise, lockingContractBalancePromise]).then(
      ([tokenBalance, lockingContractBalance]) => {
        return BigInt(tokenBalance) + BigInt(lockingContractBalance)
      },
    )
    // If the history tag changes we could have claimed / redeemed tokens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, safeAddress, safe.txHistoryTag])

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
