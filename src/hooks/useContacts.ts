import { useAppSelector } from '@/store'
import useChainId from './useChainId'
import { selectContactsByChain } from '@/store/contactsSlice'

const useContacts = () => {
  const chainId = useChainId()
  return useAppSelector((state) => selectContactsByChain(state, chainId))
}

export default useContacts
