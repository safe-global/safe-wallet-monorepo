import { useRef, type ChangeEvent } from 'react'
import { FileJson, Upload } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'

export type OfflineWorkspaceSummary = {
  uuid: string
  name: string
  safeCount: number
  contactCount: number
  memberCount: number
}

type OfflineWorkspaceSetupProps = {
  storedWorkspaces: OfflineWorkspaceSummary[]
  importedFileName?: string
  importedWorkspace?: OfflineWorkspaceSummary
  importError?: string
  onFileSelect: (file: File) => void
  onOpenStored: () => void
  onImport: () => void
  onStartEmpty: () => void
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

const describe = ({ safeCount, contactCount, memberCount }: OfflineWorkspaceSummary) =>
  [plural(safeCount, 'Safe account'), plural(contactCount, 'contact'), plural(memberCount, 'member')].join(' · ')

const OfflineWorkspaceSetup = ({
  storedWorkspaces,
  importedFileName,
  importedWorkspace,
  importError,
  onFileSelect,
  onOpenStored,
  onImport,
  onStartEmpty,
}: OfflineWorkspaceSetupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasStored = storedWorkspaces.length > 0

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFileSelect(file)
    event.target.value = ''
  }

  return (
    <div className="flex w-full flex-col gap-4" data-testid="offline-workspace-setup">
      <Typography variant="paragraph-small" color="muted" align="center">
        Workspace data stays in this browser and is never sent to Safe servers.
      </Typography>

      {hasStored ? (
        <div className="flex flex-col gap-2" data-testid="offline-stored-workspaces">
          <Typography variant="paragraph-small-medium">Stored in this browser</Typography>
          <div className="rounded-lg border border-border px-4 py-1">
            {storedWorkspaces.map((workspace) => (
              <div key={workspace.uuid} className="flex flex-col py-2">
                <Typography variant="paragraph-small-bold">{workspace.name}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {describe(workspace)}
                </Typography>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={onOpenStored} data-testid="offline-open-stored">
            Open offline {storedWorkspaces.length === 1 ? 'Workspace' : 'Workspaces'}
          </Button>
        </div>
      ) : (
        <Typography variant="paragraph-small">
          No offline Workspace is stored in this browser yet. Import a Workspace JSON file to load it.
        </Typography>
      )}

      <div className="flex flex-col gap-2">
        {hasStored && <Typography variant="paragraph-small-medium">Import another Workspace</Typography>}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
          data-testid="offline-import-input"
        />
        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
          <Upload />
          Choose JSON file
        </Button>

        {importError && (
          <Typography variant="paragraph-small" className="text-destructive" data-testid="offline-import-error">
            {importError}
          </Typography>
        )}

        {importedWorkspace && (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4" data-testid="offline-import-summary">
            <div className="flex items-start gap-3">
              <FileJson className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-col">
                <Typography variant="paragraph-small-bold">{importedWorkspace.name}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {describe(importedWorkspace)}
                </Typography>
                {importedFileName && (
                  <Typography variant="paragraph-mini" color="muted" className="truncate">
                    {importedFileName}
                  </Typography>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={onImport} data-testid="offline-import-submit">
              Import and open
            </Button>
          </div>
        )}
      </div>

      {!hasStored && (
        <Button variant="ghost" className="w-full" onClick={onStartEmpty} data-testid="offline-start-empty">
          Start with an empty Workspace
        </Button>
      )}
    </div>
  )
}

export default OfflineWorkspaceSetup
