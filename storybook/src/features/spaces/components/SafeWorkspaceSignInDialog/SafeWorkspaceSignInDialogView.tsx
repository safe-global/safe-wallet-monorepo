import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'

export type SafeWorkspaceSignInDialogViewProps = {
  onContinueWithoutWorkspace: () => void
  signInOptions: ReactNode
}

export const SafeWorkspaceSignInDialogView = ({
  onContinueWithoutWorkspace,
  signInOptions,
}: SafeWorkspaceSignInDialogViewProps): ReactElement => (
  <Dialog open onOpenChange={(open) => !open && onContinueWithoutWorkspace()}>
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

        {signInOptions}

        <Button variant="ghost-muted" size="sm" className="self-center" onClick={onContinueWithoutWorkspace}>
          Continue without Workspace
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)
