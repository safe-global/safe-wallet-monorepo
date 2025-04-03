import type { AppThunk } from '@/store'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import type { NamedAddress } from '@/components/new-safe/create/types'

export const updateAddressBook = (
  chainIds: string[],
  address: string,
  name: string,
  owners: NamedAddress[],
  threshold: number,
): AppThunk => {
  return (dispatch) => {
    dispatch(
      upsertAddressBookEntries({
        chainIds,
        address,
        name,
      }),
    )

    owners.forEach((owner) => {
      const entryName = owner.name || owner.ens
      if (entryName) {
        dispatch(upsertAddressBookEntries({ chainIds, address: owner.address, name: entryName }))
      }
    })

    chainIds.forEach((chainId) => {
      dispatch(
        addOrUpdateSafe({
          safe: {
            ...defaultSafeInfo,
            address: { value: address, name },
            threshold,
            owners: owners.map((owner) => ({
              value: owner.address,
              name: owner.name || owner.ens,
            })),
            chainId,
            nonce: 0,
          },
        }),
      )
    })
  }
}
