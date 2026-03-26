import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UseFormSetValue } from 'react-hook-form'

const useExistingSpace = (setValue: UseFormSetValue<{ name: string }>) => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined
  const isEditMode = Boolean(spaceId)

  const {
    data: existingSpace,
    isLoading: isLoadingSpace,
    isFetching: isFetchingSpace,
  } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })

  useEffect(() => {
    if (existingSpace?.name) {
      setValue('name', existingSpace.name, { shouldValidate: true })
    }
  }, [existingSpace?.name, setValue])

  const isSpaceLoading = isEditMode && (isLoadingSpace || isFetchingSpace)

  return {
    spaceId,
    isEditMode,
    isSpaceLoading,
  }
}

export default useExistingSpace
