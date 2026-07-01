import { useEffect, useRef, useState } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { type GetSpaceResponse, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import InitialsAvatar from '@/components/common/InitialsAvatar'

const MAX_NAME_LENGTH = 60

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

  const trimmedName = name.trim()
  const isDirty = !!space && trimmedName !== space.name && trimmedName.length > 0
  const canSave = isDirty && isAdmin && !isSaving && !isAwaitingCacheSync.current
  const canCancel = !!space && name !== space.name && isAdmin && !isSaving && !isAwaitingCacheSync.current

  const handleCancel = () => {
    setName(space?.name ?? '')
    setError(undefined)
  }

  const handleSave = async () => {
    if (!space || !canSave) return
    setError(undefined)
    try {
      isAwaitingCacheSync.current = true
      await updateSpace({ id: space.uuid, updateSpaceDto: { name: trimmedName } }).unwrap()
      setName(trimmedName)
      isAwaitingCacheSync.current = false
      dispatch(
        showNotification({
          variant: 'success',
          message: 'Workspace name updated',
          groupKey: 'space-update-name',
        }),
      )
    } catch (e) {
      console.error(e)
      isAwaitingCacheSync.current = false
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
    }
  }

  return (
    <section className="bg-card rounded-2xl p-6 mb-3">
      <Typography variant="paragraph-bold" className="mb-5 block tracking-tight">
        Identity
      </Typography>

      <div className="flex flex-col gap-2">
        <Label htmlFor="space-name" className="text-muted-foreground">
          Workspace name
        </Label>
        <div className="flex items-center gap-3">
          <InitialsAvatar name={space?.name ?? '?'} size="large" />
          <Input
            id="space-name"
            data-testid="space-name-input"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) {
                e.preventDefault()
                handleSave()
              }
            }}
            disabled={!isAdmin}
            error={error}
            className="max-w-md"
          />
          {canCancel && (
            <Button size="sm" variant="outline" onClick={handleCancel} data-testid="space-cancel-button">
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!canSave} data-testid="space-save-button">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default IdentitySection
