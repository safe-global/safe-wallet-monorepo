import type OfflineWorkspaceSetup from './components/OfflineWorkspaceSetup'
import type ExportWorkspaceSection from './components/ExportWorkspaceSection'

export interface OfflineWorkspaceContract {
  OfflineWorkspaceSetup: typeof OfflineWorkspaceSetup
  ExportWorkspaceSection: typeof ExportWorkspaceSection
}
