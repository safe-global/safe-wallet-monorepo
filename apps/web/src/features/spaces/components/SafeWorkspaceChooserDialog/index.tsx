import { useState, type ReactElement } from 'react'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import ChooserRow from '@/components/common/ChooserRow'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSafePageWorkspacePick } from '../../hooks/useSafeWorkspaceAttach'
import { useAddUrlSpaceId } from '../../hooks/useSafeWorkspaceCheck'

/** Asks a user who opens a Safe of several Workspaces without a `spaceId` which Workspace to open it in. */
const SafeWorkspaceChooserDialog = (): ReactElement | null => {
  const { safeKey, pick } = useSafePageWorkspacePick()
  const addUrlSpaceId = useAddUrlSpaceId()
  const isChoosing = pick?.kind === 'choose'
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isChoosing })
  // Asks once per visit to a Safe, also when useSafeWorkspaceCheck removes the chosen id again
  const [answeredSafe, setAnsweredSafe] = useState<string | undefined>(undefined)

  if (!isChoosing || answeredSafe === safeKey || !spaces) return null

  // The Workspace list and the Safes of the Workspaces are separate caches, so the list can lag behind
  const choices = spaces.filter((space) => pick.spaceIds.includes(space.uuid))
  if (choices.length === 0) return null

  const close = () => setAnsweredSafe(safeKey)
  const choose = (spaceId: string) => {
    close()
    addUrlSpaceId(spaceId)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent data-testid="safe-workspace-chooser-dialog">
        <DialogHeader>
          <DialogTitle>Open this Safe in a Workspace</DialogTitle>
          <DialogDescription>
            This Safe is in more than one of your Workspaces. Choose the Workspace to open it in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 px-4">
          {choices.map((space) => (
            <ChooserRow
              key={space.uuid}
              icon={<InitialsAvatar name={space.name} size="small" />}
              title={space.name}
              subtitle={`${space.safeCount} Safe account${maybePlural(space.safeCount)}`}
              onClick={() => choose(space.uuid)}
              testId="safe-workspace-choice"
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Continue without Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SafeWorkspaceChooserDialog
