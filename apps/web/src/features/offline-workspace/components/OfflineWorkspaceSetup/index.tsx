import { useState } from 'react'
import { useRouter } from 'next/router'
import OfflineWorkspaceSetupView, {
  type OfflineWorkspaceSummary,
} from '@safe-global/views/features/offline-workspace/components/OfflineWorkspaceSetup'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOfflineWorkspaces, setOfflineMode, upsertOfflineWorkspace } from '../../store'
import { parseWorkspaceFile } from '../../services/workspaceFile'
import type { OfflineWorkspace } from '../../types'

const toSummary = (workspace: OfflineWorkspace): OfflineWorkspaceSummary => ({
  uuid: workspace.uuid,
  name: workspace.name,
  safeCount: workspace.safes.length,
  contactCount: workspace.addressBook.length,
  memberCount: workspace.members.length,
})

/** Turns offline mode on, from the Workspaces stored in this browser or from an imported file. */
const OfflineWorkspaceSetup = ({ onEnter }: { onEnter: () => void }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const storedWorkspaces = useAppSelector(selectOfflineWorkspaces)
  const [imported, setImported] = useState<{ fileName: string; workspace: OfflineWorkspace }>()
  const [importError, setImportError] = useState<string>()

  const enterOfflineMode = () => {
    dispatch(setOfflineMode(true))
    onEnter()
  }

  const handleFileSelect = async (file: File) => {
    setImported(undefined)
    setImportError(undefined)
    try {
      setImported({ fileName: file.name, workspace: parseWorkspaceFile(await file.text()) })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The file could not be read')
    }
  }

  const handleImport = () => {
    if (!imported) return
    dispatch(upsertOfflineWorkspace(imported.workspace))
    dispatch(setOfflineMode(true))
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: imported.workspace.uuid } })
  }

  return (
    <OfflineWorkspaceSetupView
      storedWorkspaces={storedWorkspaces.map(toSummary)}
      importedFileName={imported?.fileName}
      importedWorkspace={imported && toSummary(imported.workspace)}
      importError={importError}
      onFileSelect={handleFileSelect}
      onOpenStored={enterOfflineMode}
      onImport={handleImport}
      onStartEmpty={enterOfflineMode}
    />
  )
}

export default OfflineWorkspaceSetup
