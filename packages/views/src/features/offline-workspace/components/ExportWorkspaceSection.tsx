import { Download, LogOut } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@safe-global/views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

type ExportWorkspaceSectionProps = {
  isOffline: boolean
  canExport: boolean
  onExport: () => void
  onLeaveOfflineMode: () => void
}

const ExportWorkspaceSection = ({
  isOffline,
  canExport,
  onExport,
  onLeaveOfflineMode,
}: ExportWorkspaceSectionProps) => (
  <SpaceSettingsSection data-testid="settings-export-workspace">
    <SpaceSettingsSectionTitle className="mb-2">Workspace data</SpaceSettingsSectionTitle>
    <Typography variant="paragraph-small" color="muted" className="mb-4 block">
      {isOffline
        ? 'This Workspace is in offline mode: it is stored only in this browser and never sent to Safe servers. Export it to keep a copy or to open it in another browser.'
        : 'Download this Workspace as a JSON file. You can import it later to use the Workspace in offline mode.'}
    </Typography>
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={onExport} disabled={!canExport} data-testid="export-workspace-button">
        <Download />
        Export Workspace
      </Button>
      {isOffline && (
        <Button variant="ghost" onClick={onLeaveOfflineMode} data-testid="leave-offline-mode-button">
          <LogOut />
          Leave offline mode
        </Button>
      )}
    </div>
  </SpaceSettingsSection>
)

export default ExportWorkspaceSection
