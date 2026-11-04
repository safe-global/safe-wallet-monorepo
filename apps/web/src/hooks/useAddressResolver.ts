import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { skipToken } from '@reduxjs/toolkit/query'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { useGetEnsPrimaryNameQuery } from '@/store/api/ens'
import { getEnsHubChainId, hasHubDomainLookup } from '@safe-global/utils/utils/ens'
import { useChain, useCurrentChain } from './useChains'

export const useAddressResolver = (address?: string) => {
  const addressBook = useAddressBook()
  const currentChain = useCurrentChain()
  const hubChain = useChain(currentChain ? getEnsHubChainId(!!currentChain.isTestnet) : '')
  const customRpc = useAppSelector(selectRpc)
  const name = address ? addressBook[address] : undefined

  // A partial address is never looked up, so typing needs no debounce
  const lookupArgs =
    address && isAddress(address) && !name && hubChain && hasHubDomainLookup(hubChain)
      ? { hubChainId: hubChain.chainId, address, customRpc: customRpc?.[hubChain.chainId] }
      : skipToken

  const { currentData, isFetching } = useGetEnsPrimaryNameQuery(lookupArgs)

  return useMemo(
    () => ({
      ens: currentData ?? undefined,
      name,
      resolving: isFetching,
    }),
    [currentData, name, isFetching],
  )
}
