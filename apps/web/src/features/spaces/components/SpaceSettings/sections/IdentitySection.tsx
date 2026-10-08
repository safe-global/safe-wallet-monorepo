import { useEffect, useRef, useState } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { type GetSpaceResponse, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { NAME_MIN_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { IdentitySectionView } from '@views/features/spaces/components/SpaceSettings/sections/IdentitySectionView'

const IdentitySection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const dispatch = useAppDispatch()
  const isAdmin = useIsAdmin(space?.uuid)
  const [updateSpace, { isLoading: isSaving }] = useSpacesUpdateV1Mutation()

  const [name, setName] = useState(space?.name ?? '')
  const [error, setError] = useState<string>()
  const isAwaitingCacheSync = useRef(false)

  useEffect(() => {
    if (isAwaitingCacheSync.current) {
      isAwaitingCacheSync.current = false
      return
    }
    setName(space?.name ?? '')
  }, [space?.name])

  const sanitizedName = sanitizeName(name)
  const validationError = validateName(sanitizedName, { minLength: NAME_MIN_LENGTH, maxLength: SPACE_NAME_MAX_LENGTH })
  const isUnchanged = sanitizedName === (space?.name ?? '')
  const displayError = isUnchanged ? undefined : validationError
  const isDirty = !!space && !isUnchanged && sanitizedName.length > 0
  const canSave = isDirty && isAdmin && !isSaving && !isAwaitingCacheSync.current && !validationError
  const canCancel = !!space && !isUnchanged && isAdmin && !isSaving && !isAwaitingCacheSync.current

  const handleCancel = () => {
    setName(space?.name ?? '')
    setError(undefined)
  }

  const handleSave = async () => {
    if (!space || !canSave) return
    setError(undefined)
    try {
      isAwaitingCacheSync.current = true
      await updateSpace({ id: space.uuid, updateSpaceDto: { name: sanitizedName } }).unwrap()
      setName(sanitizedName)
      isAwaitingCacheSync.current = false
      dispatch(
        showNotification({
          variant: 'success',
          message: 'Workspace name updated',
          groupKey: 'space-update-name',
        }),
      )
    } catch (e) {
      if (isElevationRequiredError(e)) return
      console.error(e)
      isAwaitingCacheSync.current = false
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
    }
  }

  return (
    <IdentitySectionView
      spaceName={space?.name}
      name={name}
      onNameChange={setName}
      onNameBlur={() => setName(sanitizeName(name))}
      isAdmin={isAdmin}
      error={error ?? displayError}
      canSave={canSave}
      canCancel={canCancel}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}

export default IdentitySection
