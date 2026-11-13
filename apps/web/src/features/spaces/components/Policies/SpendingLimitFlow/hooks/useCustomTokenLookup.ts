import { useMemo } from 'react'
import { getAddress, isAddress } from 'ethers'
import { useTokensGetTokenV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import useChainId from '@/hooks/useChainId'
import { findTokenOption, toCustomTokenOption, type TokenOption } from '../utils/tokenOptions'

export type CustomTokenLookup = {
  /** Set while the query is a valid address that none of the options has. */
  address?: string
  /** Only an ERC-20 the Transaction Service knows; a 404 or any other token type leaves it unset. */
  option?: TokenOption
  isLoading: boolean
  /** A failure other than not found. */
  isError: boolean
  refetch: () => void
}

/** Looks up a pasted token address on CGW. */
const useCustomTokenLookup = (query: string, options: readonly TokenOption[]): CustomTokenLookup => {
  const chainId = useChainId()
  const trimmed = query.trim()
  const address = isAddress(trimmed) && !findTokenOption(options, trimmed) ? getAddress(trimmed) : undefined

  const { currentData, isFetching, isError, error, refetch } = useTokensGetTokenV1Query(
    { chainId, address: address ?? '' },
    { skip: !address },
  )
  const token = address ? currentData : undefined
  const option = useMemo(() => (token?.type === 'ERC20' ? toCustomTokenOption(token) : undefined), [token])
  const isNotFound = !!error && 'status' in error && error.status === 404

  return { address, option, isLoading: !!address && isFetching, isError: !!address && isError && !isNotFound, refetch }
}

export default useCustomTokenLookup
