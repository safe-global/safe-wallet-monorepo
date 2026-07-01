import { useState } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { type GetSpaceResponse, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

export type UpdateSpaceFormData = {
  name: string
}

export const useUpdateSpace = (space: GetSpaceResponse | undefined) => {
  const [error, setError] = useState<string>()
  const dispatch = useAppDispatch()
  const [updateSpace] = useSpacesUpdateV1Mutation()

  const handleUpdate = async (data: UpdateSpaceFormData) => {
    setError(undefined)

    if (!space) {
      return
    }

    try {
      await updateSpace({ id: space.uuid, updateSpaceDto: { name: data.name } }).unwrap()

      dispatch(
        showNotification({
          variant: 'success',
          message: 'Updated workspace name',
          groupKey: 'space-update-name',
        }),
      )
    } catch (e) {
      console.error(e)
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
    }
  }

  return { handleUpdate, error }
}
