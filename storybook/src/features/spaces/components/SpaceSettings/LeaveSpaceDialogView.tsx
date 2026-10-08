import { LogOut } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type LeaveSpaceDialogViewProps = {
  spaceName?: string
  hasSpace: boolean
  error?: string
  isLoading: boolean
  onClose: () => void
  onLeave: () => void
}

export const LeaveSpaceDialogView = ({
  spaceName,
  hasSpace,
  error,
  isLoading,
  onClose,
  onLeave,
}: LeaveSpaceDialogViewProps) => {
  return (
    <AlertDialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center size-10 rounded-full bg-destructive/10 text-destructive shrink-0">
            <LogOut className="size-5" />
          </div>
          <AlertDialogTitle>Leave Workspace</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose access to <span className="font-semibold text-foreground">{spaceName}</span> immediately.
            An admin can re-invite you later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Typography variant="paragraph-small" color="muted">
          Your wallet and any linked Safe accounts are not affected.
        </Typography>

        {error && (
          <Alert variant="destructive">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogActions
          onCancel={onClose}
          cancelDisabled={isLoading}
          confirmLabel="Leave Workspace"
          onConfirm={onLeave}
          confirmDisabled={isLoading || !hasSpace}
          confirmLoading={isLoading}
          confirmDestructive
          confirmTestId="space-confirm-leave-button"
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
