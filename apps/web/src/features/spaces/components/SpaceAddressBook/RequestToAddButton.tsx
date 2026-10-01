import { useState } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, Plus } from 'lucide-react'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
import { NetworkLogosTooltip } from '@/features/multichain'
import useChains from '@/hooks/useChains'
import { useAddOrRequestWorkspaceContact } from '../../hooks/useAddOrRequestWorkspaceContact'
import { validateContactName } from './utils'

type RequestToAddButtonProps = {
  address: string
  name: string
  chainIds: string[]
  alreadyRequested?: boolean
  isCompact?: boolean
}

const RequestToAddButton = ({ address, name, chainIds, alreadyRequested, isCompact }: RequestToAddButtonProps) => {
  const chains = useChains()
  const addOrRequestContact = useAddOrRequestWorkspaceContact()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [open, setOpen] = useState(false)

  const isDone = alreadyRequested || requested
  const nameError = validateContactName(name)

  const handleConfirm = async () => {
    if (isDone) return

    setIsSubmitting(true)
    try {
      const result = await addOrRequestContact({ address, name, chainIds })
      if (result === 'requested' || result === 'pending') {
        setRequested(true)
        setOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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
      onClick={() => setOpen(true)}
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

      <ModalDialog open={open} onClose={() => setOpen(false)} dialogTitle="Request to add contact" hideChainIndicator>
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
              <EthHashInfo address={address} shortAddress={false} showPrefix={false} showName={false} avatarSize={24} />
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="paragraph-small" color="muted">
                Networks
              </Typography>
              {chains.configs.length === chainIds.length ? (
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
          onCancel={() => setOpen(false)}
          cancelTestId="cancel-btn"
          confirmLabel="Request to add"
          onConfirm={handleConfirm}
          confirmTestId="confirm-request-btn"
          confirmDisabled={!!nameError || isSubmitting}
          confirmLoading={isSubmitting}
        />
      </ModalDialog>
    </>
  )
}

export default RequestToAddButton
