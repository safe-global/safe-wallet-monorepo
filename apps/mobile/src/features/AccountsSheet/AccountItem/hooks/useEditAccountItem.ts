import { selectActiveSafe, setActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectMyAccountsMode, setEditMode } from '@/src/store/myAccountsSlice'
import { removeSafe, selectAllSafes } from '@/src/store/safesSlice'
import { Address } from '@/src/types/address'
import { useCallback } from 'react'
import { useNavigation } from 'expo-router'
import { CommonActions } from '@react-navigation/native'

export const useEditAccountItem = () => {
  const isEdit = useAppSelector(selectMyAccountsMode)
  const activeSafe = useAppSelector(selectActiveSafe)
  const safes = useAppSelector(selectAllSafes)
  const dispatch = useAppDispatch()
  const navigation = useNavigation()

  const deleteSafe = useCallback(
    (address: Address) => {
      if (activeSafe?.address === address) {
        const safe = Object.values(safes).find((item) => item.SafeInfo.address.value !== address)

        if (safe) {
          dispatch(
            setActiveSafe({
              address: safe.SafeInfo.address.value as Address,
              chainId: safe.chains[0],
            }),
          )
        } else {
          // If we are here it means that the user has deleted all safes
          // We need to reset the navigation to the onboarding screen
          // Otherwise the app will crash as there is no active safe
          navigation.dispatch(
            CommonActions.reset({
              routes: [{ name: 'onboarding' }],
            }),
          )

          dispatch(setEditMode(false))
          dispatch(setActiveSafe(null))
        }
      }

      dispatch(removeSafe(address))
    },
    [activeSafe],
  )

  return { isEdit, deleteSafe }
}
