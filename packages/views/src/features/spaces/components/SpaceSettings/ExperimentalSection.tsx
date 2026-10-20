import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@safe-global/views/components/ui/field'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Switch } from '@safe-global/views/components/ui/switch'
import { AdminOnlyWorkspaceTooltip } from '@safe-global/views/features/spaces/components/AdminOnlyWorkspaceTooltip'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export const EXPERIMENTAL_ADMIN_ONLY_MESSAGE = 'Only admins can change experimental features for this Workspace'
export const EXPERIMENTAL_EMPTY_MESSAGE = 'No experimental features are available for this Workspace yet.'

export type ExperimentalFeature = GetSpaceResponse['experimentalFeatures'][number]

export const EXPERIMENTAL_FEATURES = [
  {
    key: 'POLICY_RECIPIENT_ALLOWLIST',
    label: 'Recipient allowlist',
    description: 'Sepolia testnet only. Try our new policy engine.',
  },
] as const satisfies ReadonlyArray<{ key: ExperimentalFeature; label: string; description: string }>

type ExperimentalSectionProps = {
  available: ExperimentalFeature[]
  enabled: ExperimentalFeature[]
  onChange: (enabled: ExperimentalFeature[]) => void
  isAdmin: boolean
  isSaving?: boolean
  disabled?: boolean
}

const ExperimentalSection = ({
  available,
  enabled,
  onChange,
  isAdmin,
  isSaving = false,
  disabled = false,
}: ExperimentalSectionProps) => {
  const features = EXPERIMENTAL_FEATURES.filter(({ key }) => available.includes(key))

  const handleToggle = (key: ExperimentalFeature, checked: boolean) => {
    onChange(checked ? [...enabled, key] : enabled.filter((enabledKey) => enabledKey !== key))
  }

  return (
    <SpaceSettingsSection data-testid="settings-experimental-section">
      <SpaceSettingsSectionTitle>Experimental</SpaceSettingsSectionTitle>

      {features.length === 0 && (
        <p className="text-muted-foreground text-sm" data-testid="experimental-empty">
          {EXPERIMENTAL_EMPTY_MESSAGE}
        </p>
      )}

      {features.map(({ key, label, description }) => {
        const id = `experimental-${key}`

        return (
          <Field key={key} orientation="horizontal">
            <FieldContent>
              <FieldLabel id={`${id}-label`} htmlFor={`${id}-toggle`}>
                {label}
              </FieldLabel>
              <FieldDescription>{description}</FieldDescription>
            </FieldContent>
            <div className="flex shrink-0 items-center gap-2">
              {isSaving && <Spinner className="text-muted-foreground" />}
              <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="left" message={EXPERIMENTAL_ADMIN_ONLY_MESSAGE}>
                <Switch
                  id={`${id}-toggle`}
                  aria-labelledby={`${id}-label`}
                  checked={enabled.includes(key)}
                  onCheckedChange={(checked) => handleToggle(key, checked)}
                  disabled={!isAdmin || isSaving || disabled}
                  data-testid={`${id}-toggle`}
                />
              </AdminOnlyWorkspaceTooltip>
            </div>
          </Field>
        )
      })}
    </SpaceSettingsSection>
  )
}

export default ExperimentalSection
