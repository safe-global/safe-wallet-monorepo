import { useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import useChainId from './useChainId'

const useAddressBook = (chainId?: string) => {
  const currentChainId = useChainId()
  return useAppSelector((state) => selectAddressBookByChain(state, chainId ?? currentChainId))
}

export default useAddressBook
