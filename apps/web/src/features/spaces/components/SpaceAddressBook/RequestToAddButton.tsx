import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
import { NetworkLogosTooltip } from '@/features/multichain'
import { useAddressBookRequestsCreateRequestV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import useChains from '@/hooks/useChains'
import { validateContactName } from './utils'
import { sanitizeName } from '@safe-global/utils/validation/names'

type RequestToAddButtonProps = {
  address: string
  name: string
  chainIds: string[]
  alreadyRequested?: boolean
}

const getRequestErrorMessage = (error: unknown): string => {
  const err = error as { status?: number | string; data?: { message?: string } }
  if (err?.status === 409) return 'A request for this address is already pending.'
  if (err?.status === 429) return 'Too many requests. Please try again later.'
  if (typeof err?.data?.message === 'string') return err.data.message
  return 'Failed to create request. Please try again.'
}

const RequestToAddButton = ({ address, name, chainIds, alreadyRequested }: RequestToAddButtonProps) => {
  const spaceId = useCurrentSpaceId()
  const chains = useChains()
  const dispatch = useAppDispatch()
  const [createRequest] = useAddressBookRequestsCreateRequestV1Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [open, setOpen] = useState(false)

  const isDone = alreadyRequested || requested
  const nameError = validateContactName(name)

  const handleConfirm = async () => {
    if (!spaceId || isDone) return

    try {
      setIsSubmitting(true)

      const result = await createRequest({
        spaceId,
        createAddressBookRequestDto: { address, name: sanitizeName(name), chainIds },
      })

      if (result.error) {
        const err = result.error as { status?: number | string }
        // A pending request already exists, reflect that instead of erroring
        if (err.status === 409) {
          setRequested(true)
          setOpen(false)
        }
        dispatch(
          showNotification({
            message: getRequestErrorMessage(result.error),
            variant: 'error',
            groupKey: 'request-to-add-error',
          }),
        )
        return
      }

      setRequested(true)
      setOpen(false)
      dispatch(
        showNotification({
          message: 'Request submitted for admin approval',
          variant: 'success',
          groupKey: 'request-to-add-success',
        }),
      )
    } catch {
      dispatch(
        showNotification({
          message: 'Something went wrong. Please try again.',
          variant: 'error',
          groupKey: 'request-to-add-error',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isDone) {
    return <Badge variant="secondary">Requested</Badge>
  }

  const trigger = (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={!!nameError}>
      Request to add
    </Button>
  )

  return (
    <>
      {nameError ? <InvalidContactNameTooltip nameError={nameError}>{trigger}</InvalidContactNameTooltip> : trigger}

      <ModalDialog open={open} onClose={() => setOpen(false)} dialogTitle="Request to add contact" hideChainIndicator>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            <Typography variant="paragraph-small" color="muted">
              An admin has to approve the request before the contact appears in the workspace address book.
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
              <Alert variant="warning">
                <AlertDescription>Rename this contact to share it with the workspace. {nameError}.</AlertDescription>
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
