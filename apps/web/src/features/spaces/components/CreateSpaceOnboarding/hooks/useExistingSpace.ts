import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UseFormSetValue } from 'react-hook-form'
import { CREATED_SPACE_QUERY_PARAM } from '@/features/spaces/constants'

const useExistingSpace = (setValue: UseFormSetValue<{ name: string }>) => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined
  const isEditMode = Boolean(spaceId)
  const createdSpaceParam = router.query[CREATED_SPACE_QUERY_PARAM]
  const lookupId = spaceId ?? (typeof createdSpaceParam === 'string' ? createdSpaceParam : undefined)

  const {
    data: existingSpace,
    isLoading: isLoadingSpace,
    isFetching: isFetchingSpace,
  } = useSpacesGetOneV1Query({ id: lookupId ?? '' }, { skip: !lookupId })

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
    existingSpace,
  }
}

export default useExistingSpace
