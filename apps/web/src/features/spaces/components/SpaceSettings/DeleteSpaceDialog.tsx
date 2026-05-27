import { useState } from 'react'
import { useRouter } from 'next/router'
import { AlertTriangle, Check, X } from 'lucide-react'
import { type GetSpaceResponse, useSpacesDeleteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

type Consequence = { variant: 'danger' | 'success'; text: string }

const CONSEQUENCES: Consequence[] = [
  { variant: 'danger', text: 'Members lose access to this workspace immediately.' },
  { variant: 'danger', text: 'Member list and Safe Account names are deleted.' },
  { variant: 'success', text: 'Linked Safe Accounts keep working — only the workspace is removed.' },
]

const ConsequenceRow = ({ variant, text }: Consequence) => (
  <li className="flex items-start gap-3">
    <span
      className={
        variant === 'danger'
          ? 'flex items-center justify-center size-5 rounded-full bg-destructive/10 text-destructive shrink-0 mt-0.5'
          : 'flex items-center justify-center size-5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground shrink-0 mt-0.5'
      }
    >
      {variant === 'danger' ? <X className="size-3" /> : <Check className="size-3" />}
    </span>
    <Typography variant="paragraph-small">{text}</Typography>
  </li>
)

const DeleteSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse | undefined; onClose: () => void }) => {
  const [error, setError] = useState<string>()
  const [confirmName, setConfirmName] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [deleteSpace, { isLoading }] = useSpacesDeleteV1Mutation()

  const canConfirm = !!space && confirmName.trim() === space.name.trim() && !isLoading

  const onDelete = async () => {
    if (!space || !canConfirm) return

    setError(undefined)

    try {
      await deleteSpace({ id: space.id }).unwrap()
      onClose()

      trackEvent({ ...SPACE_EVENTS.DELETE_SPACE })
      dispatch(
        showNotification({
          message: `Deleted workspace ${space.name}.`,
          variant: 'success',
          groupKey: 'delete-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      console.error(e)
      setError('Error deleting the workspace. Please try again.')
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center size-10 rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <AlertDialogTitle>Delete workspace</AlertDialogTitle>
          <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex flex-col gap-3">
          {CONSEQUENCES.map((item) => (
            <ConsequenceRow key={item.text} {...item} />
          ))}
        </ul>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="delete-confirm-input">
            Type <span className="font-mono font-semibold text-foreground">{space?.name}</span> to confirm
          </Label>
          <Input
            id="delete-confirm-input"
            data-testid="space-confirm-name-input"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={space?.name}
            autoComplete="off"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canConfirm}
            data-testid="space-confirm-delete-button"
          >
            {isLoading ? 'Deleting…' : 'Delete workspace'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteSpaceDialog
