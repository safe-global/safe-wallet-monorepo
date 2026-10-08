import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, Plus } from 'lucide-react'
import InvalidContactNameTooltip from '@/features/spaces/components/SpaceAddressBook/InvalidContactNameTooltip'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import NetworkLogosTooltip from '@/features/multichain/components/NetworkLogosTooltip'

export type RequestToAddButtonViewProps = {
  name: string
  chainIds: string[]
  isCompact?: boolean
  isDone: boolean
  nameError?: string
  isSubmitting: boolean
  open: boolean
  allChainsCount: number
  addressSlot: ReactNode
  onOpen: () => void
  onClose: () => void
  onConfirm: () => void
}

export function RequestToAddButtonView({
  name,
  chainIds,
  isCompact,
  isDone,
  nameError,
  isSubmitting,
  open,
  allChainsCount,
  addressSlot,
  onOpen,
  onClose,
  onConfirm,
}: RequestToAddButtonViewProps) {
  if (isDone) {
    return isCompact ? (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" aria-label="Requested" />}>
          <Clock className="text-muted-foreground size-4" />
        </TooltipTrigger>
        <TooltipContent>Requested</TooltipContent>
      </Tooltip>
    ) : (
      <Badge variant="secondary">Requested</Badge>
    )
  }

  // Compact has no room for the label, so it moves into the accessible name and a tooltip
  const button = (
    <Button
      variant="outline"
      size={isCompact ? 'icon-sm' : 'sm'}
      aria-label={isCompact ? 'Request to add' : undefined}
      onClick={onOpen}
      disabled={!!nameError}
    >
      {isCompact ? <Plus className="size-4" /> : 'Request to add'}
    </Button>
  )

  const trigger = isCompact ? (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>Request to add</TooltipContent>
    </Tooltip>
  ) : (
    button
  )

  return (
    <>
      {nameError ? <InvalidContactNameTooltip nameError={nameError}>{button}</InvalidContactNameTooltip> : trigger}

      <ModalDialog open={open} onClose={onClose} dialogTitle="Request to add contact" hideChainIndicator>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            <Typography variant="paragraph-small" color="muted">
              An admin has to approve the request before the contact appears in the Workspace address book.
            </Typography>

            <div className="flex flex-col gap-1">
              <Typography variant="paragraph-small" color="muted">
                Name
              </Typography>
              <Typography>{name}</Typography>
            </div>

            <div className="flex flex-col gap-1">
              <Typography variant="paragraph-small" color="muted">
                Address
              </Typography>
              {addressSlot}
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="paragraph-small" color="muted">
                Networks
              </Typography>
              {allChainsCount === chainIds.length ? (
                <Typography>All networks</Typography>
              ) : (
                <NetworkLogosTooltip
                  networks={chainIds.map((chainId) => ({ chainId }))}
                  maxVisible={6}
                  triggerRender={<span className="inline-flex" />}
                />
              )}
            </div>

            {nameError && (
              <Alert variant="warning" outlined={false}>
                <AlertSeverityIcon variant="warning" />
                <AlertDescription>Rename this contact to share it with the Workspace. {nameError}.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogActions
          className="px-6 pt-0 pb-6"
          onCancel={onClose}
          cancelTestId="cancel-btn"
          confirmLabel="Request to add"
          onConfirm={onConfirm}
          confirmTestId="confirm-request-btn"
          confirmDisabled={!!nameError || isSubmitting}
          confirmLoading={isSubmitting}
        />
      </ModalDialog>
    </>
  )
}
