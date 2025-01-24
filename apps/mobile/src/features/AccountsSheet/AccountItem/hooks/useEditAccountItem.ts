import { selectActiveSafe, setActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectMyAccountsMode } from '@/src/store/myAccountsSlice'
import { removeSafe, selectAllSafes } from '@/src/store/safesSlice'
import { Address } from '@/src/types/address'
import { useCallback } from 'react'

export const useEditAccountItem = () => {
  const isEdit = useAppSelector(selectMyAccountsMode)
  const activeSafe = useAppSelector(selectActiveSafe)
  const safes = useAppSelector(selectAllSafes)
  const dispatch = useAppDispatch()

  const onSafeDeleted = useCallback(
    (address: Address) => () => {
      if (activeSafe.address === address) {
        const safe = Object.values(safes).find((item) => item.SafeInfo.address.value !== address)

        if (safe) {
          dispatch(
            setActiveSafe({
              address: safe.SafeInfo.address.value as Address,
              chainId: safe.chains[0],
            }),
          )
        }
      }

      dispatch(removeSafe(address))
    },
    [activeSafe],
  )

  return { isEdit, onSafeDeleted }
}
