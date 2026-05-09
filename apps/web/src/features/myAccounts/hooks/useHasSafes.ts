import { useAllOwnedSafes } from '@/hooks/safes'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import isEmpty from 'lodash/isEmpty'

const useHasSafes = () => {
  const { address = '' } = useWallet() || {}
  const allAdded = useAppSelector(selectAllAddedSafes)
  const hasAdded = !isEmpty(allAdded)
  const [allOwned] = useAllOwnedSafes(!hasAdded ? address : '') // pass an empty string to not fetch owned safes

  if (hasAdded) return { isLoaded: true, hasSafes: hasAdded }
  if (!allOwned) return { isLoaded: false }

  const hasOwned = !isEmpty(Object.values(allOwned).flat())
  return { isLoaded: true, hasSafes: hasOwned }
}

export default useHasSafes
