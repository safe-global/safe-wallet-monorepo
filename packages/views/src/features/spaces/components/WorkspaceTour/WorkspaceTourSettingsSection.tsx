import { Sparkles } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export type WorkspaceTourSettingsSectionProps = {
  onStart: () => void
}

const WorkspaceTourSettingsSection = ({ onStart }: WorkspaceTourSettingsSectionProps) => (
  <SpaceSettingsSection>
    <SpaceSettingsSectionTitle>Workspace tour</SpaceSettingsSectionTitle>
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Typography variant="paragraph-small" color="muted">
        A one-minute look at what your workspace can do.
      </Typography>
      <Button data-testid="settings-take-tour" variant="outline" onClick={onStart}>
        <Sparkles />
        Take the tour
      </Button>
    </div>
  </SpaceSettingsSection>
)

export default WorkspaceTourSettingsSection
