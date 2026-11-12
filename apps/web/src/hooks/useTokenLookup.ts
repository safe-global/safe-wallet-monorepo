import { getAddress, isAddress } from 'ethers'
import { useTokensGetTokenV1Query, type Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import useChainId from '@/hooks/useChainId'

export type TokenLookup = {
  /** Set while the input is a valid address. */
  address?: string
  /** Only an ERC-20 the Transaction Service knows; a 404 or any other token type leaves it unset. */
  token?: Erc20TokenMetadata
  isLoading: boolean
  /** A failure other than not found. */
  isError: boolean
  refetch: () => void
}

/** Looks up a token address on the current chain through CGW. Anything that is not an address is skipped. */
const useTokenLookup = (input: string | undefined): TokenLookup => {
  const chainId = useChainId()
  const trimmed = input?.trim() ?? ''
  const address = isAddress(trimmed) ? getAddress(trimmed) : undefined

  const { currentData, isFetching, isError, error, refetch } = useTokensGetTokenV1Query(
    { chainId, address: address ?? '' },
    { skip: !address },
  )
  const isNotFound = !!error && 'status' in error && error.status === 404

  return {
    address,
    token: address && currentData?.type === 'ERC20' ? currentData : undefined,
    isLoading: !!address && isFetching,
    isError: !!address && isError && !isNotFound,
    refetch,
  }
}

export default useTokenLookup
