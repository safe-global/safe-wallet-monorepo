import { Field, FieldContent, FieldDescription, FieldLabel } from '@safe-global/views/components/ui/field'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Switch } from '@safe-global/views/components/ui/switch'
import { AdminOnlyWorkspaceTooltip } from '@safe-global/views/features/spaces/components/AdminOnlyWorkspaceTooltip'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export const EXPERIMENTAL_ADMIN_ONLY_MESSAGE = 'Only admins can change experimental features for this Workspace'

type ExperimentalSectionProps = {
  isRecipientAllowlistEnabled: boolean
  onRecipientAllowlistChange: (enabled: boolean) => void
  isAdmin: boolean
  isSaving?: boolean
}

const ExperimentalSection = ({
  isRecipientAllowlistEnabled,
  onRecipientAllowlistChange,
  isAdmin,
  isSaving = false,
}: ExperimentalSectionProps) => {
  return (
    <SpaceSettingsSection data-testid="settings-experimental-section">
      <SpaceSettingsSectionTitle>Experimental</SpaceSettingsSectionTitle>

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel id="recipient-allowlist-label" htmlFor="recipient-allowlist-toggle">
            Recipient allowlist
          </FieldLabel>
          <FieldDescription>Sepolia testnet only. Try our new policy engine.</FieldDescription>
        </FieldContent>
        <div className="flex shrink-0 items-center gap-2">
          {isSaving && <Spinner className="text-muted-foreground" />}
          <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="left" message={EXPERIMENTAL_ADMIN_ONLY_MESSAGE}>
            <Switch
              id="recipient-allowlist-toggle"
              aria-labelledby="recipient-allowlist-label"
              checked={isRecipientAllowlistEnabled}
              onCheckedChange={onRecipientAllowlistChange}
              disabled={!isAdmin || isSaving}
              data-testid="recipient-allowlist-toggle"
            />
          </AdminOnlyWorkspaceTooltip>
        </div>
      </Field>
    </SpaceSettingsSection>
  )
}

export default ExperimentalSection
