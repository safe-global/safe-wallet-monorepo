import type { ReactElement, ReactNode } from 'react'
import Track from '@/components/common/Track'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import DeleteIcon from '@/public/images/common/delete.svg'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import DialogActions from '@/components/common/DialogActions'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { XIcon } from 'lucide-react'

export type DeleteProposerDialogViewProps = {
  open: boolean
  canDelete: boolean
  multiSigInitiated: boolean
  isMultiSigRequired: boolean
  parentThreshold?: number
  parentOwnersCount?: number
  isLoading: boolean
  isParentLoading: boolean
  hasError: boolean
  onOpen: () => void
  onCancel: () => void
  onConfirm: () => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
  renderErrorMessage: (fallback: string) => ReactNode
}

export const DeleteProposerDialogView = ({
  open,
  canDelete,
  multiSigInitiated,
  isMultiSigRequired,
  parentThreshold,
  parentOwnersCount,
  isLoading,
  isParentLoading,
  hasError,
  onOpen,
  onCancel,
  onConfirm,
  renderCheckWallet,
  renderErrorMessage,
}: DeleteProposerDialogViewProps) => {
  return (
    <>
      {renderCheckWallet((isOk) => {
        const tooltipTitle =
          isOk && canDelete
            ? 'Delete proposer'
            : isOk && !canDelete
              ? 'Only the owner of this proposer or the proposer itself can delete them'
              : ''

        const button = (
          <span tabIndex={0}>
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="delete-proposer-btn"
              onClick={onOpen}
              disabled={!isOk || !canDelete}
            >
              <DeleteIcon className="size-4 text-destructive" />
            </Button>
          </span>
        )

        return (
          <Track {...SETTINGS_EVENTS.PROPOSERS.REMOVE_PROPOSER}>
            {tooltipTitle ? (
              <Tooltip>
                <TooltipTrigger render={button} />
                <TooltipContent>{tooltipTitle}</TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </Track>
        )
      })}

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent padding="none" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>{multiSigInitiated ? 'Signature collection initiated' : 'Delete this proposer?'}</DialogTitle>

            <Button variant="ghost" size="icon-sm" aria-label="close" onClick={onCancel}>
              <XIcon />
            </Button>
          </DialogHeader>

          <Separator />

          <div className="p-4">
            {multiSigInitiated ? (
              <>
                <Alert variant="info" className="mb-4">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>1 of {parentThreshold} signatures collected</AlertDescription>
                </Alert>

                <Typography variant="paragraph-small" className="mb-4 block">
                  The removal request has been created as an off-chain message on your parent Safe. Other owners of the
                  parent Safe need to sign it before the proposer can be removed.
                </Typography>

                <Typography variant="paragraph-small" color="muted">
                  The other parent Safe owners can find and sign this pending delegation on the proposer settings page
                  of this Safe.
                </Typography>
              </>
            ) : (
              <>
                {isMultiSigRequired && (
                  <Alert variant="info" className="mb-4">
                    <AlertSeverityIcon variant="info" />
                    <AlertDescription>
                      This requires {parentThreshold} of {parentOwnersCount ?? '?'} parent Safe owner signatures to
                      complete.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mb-4">
                  <Typography>
                    Deleting this proposer will permanently remove the address, and it won&apos;t be able to suggest
                    transactions anymore.
                    <br />
                    <br />
                    To complete this action, confirm it with your connected wallet signature.
                  </Typography>
                </div>

                {hasError && <div className="mt-4">{renderErrorMessage('Error deleting proposer')}</div>}

                <NetworkWarning action="sign" />
              </>
            )}
          </div>

          <Separator />

          {/* eslint-disable-next-line no-restricted-syntax -- p-6: bespoke footer padding around DialogActions (item A), no token */}
          <DialogFooter className="p-6">
            {multiSigInitiated ? (
              <DialogActions confirmLabel="Done" onConfirm={onCancel} />
            ) : (
              <DialogActions
                onCancel={onCancel}
                cancelLabel="No, keep it"
                cancelTestId="reject-delete-proposer-btn"
                confirmLabel="Yes, delete"
                confirmTestId="confirm-delete-proposer-btn"
                confirmDestructive
                confirmLoading={isLoading}
                confirmDisabled={isParentLoading || !canDelete}
                confirmCheckWallet={{ checkNetwork: !isLoading }}
                onConfirm={onConfirm}
              />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
