import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { type GetSpaceResponse, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '../../InitialsAvatar'
import { useIsAdmin } from '@/features/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

const MAX_NAME_LENGTH = 60

const IdentitySection = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const dispatch = useAppDispatch()
  const isAdmin = useIsAdmin(space?.id)
  const [updateSpace, { isLoading: isSaving }] = useSpacesUpdateV1Mutation()

  const [name, setName] = useState(space?.name ?? '')
  const [error, setError] = useState<string>()

  useEffect(() => {
    setName(space?.name ?? '')
  }, [space?.name])

  const isDirty = !!space && name !== space.name && name.trim().length > 0
  const canSave = isDirty && isAdmin && !isSaving

  const handleSave = async () => {
    if (!space || !canSave) return
    setError(undefined)
    try {
      await updateSpace({ id: space.id, updateSpaceDto: { name: name.trim() } }).unwrap()
      dispatch(
        showNotification({
          variant: 'success',
          message: 'Updated space name',
          groupKey: 'space-update-name',
        }),
      )
    } catch (e) {
      console.error(e)
      setError('Error updating the space. Please try again.')
    }
  }

  return (
    <section className="bg-card rounded-2xl p-6 mb-4">
      <Typography variant="paragraph-bold" className="mb-4 block">
        Identity
      </Typography>

      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
        <InitialsAvatar name={space?.name ?? '?'} size="large" />
        <Typography variant="paragraph-small-bold" className="flex-1 min-w-0">
          Workspace avatar
        </Typography>
        <Button variant="outline" size="sm" disabled aria-label="Upload avatar (coming soon)">
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="space-name">Workspace name</Label>
        <Input
          id="space-name"
          data-testid="space-name-input"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          disabled={!isAdmin}
          error={error}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave} data-testid="space-save-button">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default IdentitySection
