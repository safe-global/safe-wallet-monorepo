import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export type IdentitySectionViewProps = {
  spaceName?: string
  name: string
  onNameChange: (value: string) => void
  onNameBlur: () => void
  isAdmin: boolean
  error?: string
  canSave: boolean
  canCancel: boolean
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

export const IdentitySectionView = ({
  spaceName,
  name,
  onNameChange,
  onNameBlur,
  isAdmin,
  error,
  canSave,
  canCancel,
  isSaving,
  onSave,
  onCancel,
}: IdentitySectionViewProps) => {
  return (
    <SpaceSettingsSection>
      <SpaceSettingsSectionTitle>Identity</SpaceSettingsSectionTitle>

      <div className="flex flex-col gap-2">
        <Label htmlFor="space-name" className="text-muted-foreground">
          Workspace name
        </Label>
        <div className="flex items-center gap-3">
          <InitialsAvatar name={spaceName ?? '?'} size="large" />
          <Input
            id="space-name"
            data-testid="space-name-input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => onNameBlur()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) {
                e.preventDefault()
                onSave()
              }
            }}
            disabled={!isAdmin}
            error={error}
            className="max-w-md"
          />
          {canCancel && (
            <Button variant="outline" onClick={onCancel} data-testid="space-cancel-button">
              Cancel
            </Button>
          )}
          <Button onClick={onSave} disabled={!canSave} data-testid="space-save-button">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </SpaceSettingsSection>
  )
}
