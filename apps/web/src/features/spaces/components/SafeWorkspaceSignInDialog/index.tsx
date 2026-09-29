import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SignInOptions from '../SignInOptions'
import { useRemoveUrlSpaceId, useSafeWorkspaceAction } from '../../hooks/useSafeWorkspaceCheck'

// Sign-in updates the session, and the Workspace check then takes over.
const noop = () => {}

/** Asks a signed-out user who opens a Workspace link to a Safe to sign in, or to continue without it. */
const SafeWorkspaceSignInDialog = (): ReactElement | null => {
  const action = useSafeWorkspaceAction()
  const removeUrlSpaceId = useRemoveUrlSpaceId()

  if (action !== 'signIn') return null

  return (
    <Dialog open onOpenChange={(open) => !open && removeUrlSpaceId()}>
      <DialogContent size="sm" surface="card" padding="sm" data-testid="safe-workspace-sign-in-dialog">
        <div className="flex flex-col gap-6 pt-5">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              Sign in to open this Safe in its Workspace
            </Typography>
            <Typography color="muted">
              This link opens the Safe in a Workspace. Sign in as a member of the Workspace to see it there.
            </Typography>
          </div>

          <SignInOptions afterSignIn={noop} />

          <Button variant="ghost-muted" size="sm" className="self-center" onClick={removeUrlSpaceId}>
            Continue without Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SafeWorkspaceSignInDialog
