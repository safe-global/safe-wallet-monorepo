import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import {
  encodeEIP1271Signature,
  signProposerData,
  signProposerTypedData,
  signProposerTypedDataForSafe,
} from '@/features/proposers/utils/utils'
import { useParentSafeThreshold } from '../hooks/useParentSafeThreshold'
import { buildDelegationOrigin, createDelegationMessage } from '../services/delegationMessages'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import useWallet from '@/hooks/wallets/useWallet'
import DeleteIcon from '@/public/images/common/delete.svg'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { isEthSignWallet } from '@/utils/wallets'
import {
  useDelegatesDeleteDelegateV1Mutation,
  useDelegatesDeleteDelegateV2Mutation,
  type Delegate,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import React, { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { XIcon } from 'lucide-react'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

type DeleteProposerProps = {
  wallet: ReturnType<typeof useWallet>
  safeAddress: ReturnType<typeof useSafeAddress>
  chainId: ReturnType<typeof useChainId>
  proposer: Delegate
}

const InternalDeleteProposer = ({ wallet, safeAddress, chainId, proposer }: DeleteProposerProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [multiSigInitiated, setMultiSigInitiated] = useState<boolean>(false)
  const [deleteDelegateV1] = useDelegatesDeleteDelegateV1Mutation()
  const [deleteDelegateV2] = useDelegatesDeleteDelegateV2Mutation()
  const dispatch = useAppDispatch()
  const nestedSafeOwners = useNestedSafeOwners()

  // For delete, the delegator is always the original creator (proposer.delegator).
  // Determine if it's a nested Safe to decide the signing path.
  const isNestedDelegator = nestedSafeOwners?.some((addr) => sameAddress(addr, proposer.delegator)) ?? false
  const parentSafeAddress = isNestedDelegator ? proposer.delegator : undefined
  const {
    threshold: parentThreshold,
    owners: parentOwners,
    isLoading: isParentLoading,
  } = useParentSafeThreshold(parentSafeAddress)

  const isMultiSigRequired = isNestedDelegator && parentThreshold !== undefined && parentThreshold > 1

  const onConfirm = async () => {
    setError(undefined)

    if (!wallet?.provider || !safeAddress || !chainId) {
      setError(new Error('Please connect your wallet first'))
      return
    }

    setIsLoading(true)

    try {
      const shouldEthSign = isEthSignWallet(wallet)
      const signer = await getAssertedChainSigner(wallet.provider)

      if (parentSafeAddress && isMultiSigRequired) {
        // Multi-sig flow: create off-chain message on parent Safe for signature collection
        const eoaSignature = await signProposerTypedDataForSafe(chainId, proposer.delegate, parentSafeAddress, signer)
        const delegateTypedData = getDelegateTypedData(chainId, proposer.delegate) as TypedData
        const origin = buildDelegationOrigin('remove', proposer.delegate, safeAddress, proposer.label)

        await createDelegationMessage(dispatch, chainId, parentSafeAddress, delegateTypedData, eoaSignature, origin)

        setMultiSigInitiated(true)
        trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_REMOVE_PROPOSER)
        setIsLoading(false)
        return
      }

      let signature: string

      if (parentSafeAddress) {
        // Single-sig nested Safe owner
        const eoaSignature = await signProposerTypedDataForSafe(chainId, proposer.delegate, parentSafeAddress, signer)
        signature = await encodeEIP1271Signature(parentSafeAddress, eoaSignature)

        await deleteDelegateV2({
          chainId,
          delegateAddress: proposer.delegate,
          deleteDelegateV2Dto: {
            delegator: parentSafeAddress,
            safe: safeAddress,
            signature,
          },
        }).unwrap()
      } else {
        signature = shouldEthSign
          ? await signProposerData(proposer.delegate, signer)
          : await signProposerTypedData(chainId, proposer.delegate, signer)

        if (shouldEthSign) {
          await deleteDelegateV1({
            chainId,
            delegateAddress: proposer.delegate,
            deleteDelegateDto: {
              delegate: proposer.delegate,
              delegator: proposer.delegator,
              signature,
            },
          }).unwrap()
        } else {
          await deleteDelegateV2({
            chainId,
            delegateAddress: proposer.delegate,
            deleteDelegateV2Dto: {
              delegator: proposer.delegator,
              safe: safeAddress,
              signature,
            },
          }).unwrap()
        }
      }

      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_REMOVE_PROPOSER)

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'delete-proposer-success',
          title: 'Proposer deleted successfully!',
          message: `${shortenAddress(proposer.delegate)} can not suggest transactions anymore.`,
        }),
      )
      setOpen(false)
    } catch (err) {
      setError(asError(err))
      return
    } finally {
      setIsLoading(false)
    }
  }

  const onCancel = () => {
    trackEvent(SETTINGS_EVENTS.PROPOSERS.CANCEL_REMOVE_PROPOSER)
    setOpen(false)
    setIsLoading(false)
    setError(undefined)
    setMultiSigInitiated(false)
  }

  const canDelete =
    sameAddress(wallet?.address, proposer.delegate) ||
    sameAddress(wallet?.address, proposer.delegator) ||
    (nestedSafeOwners?.some((addr) => sameAddress(addr, proposer.delegator)) ?? false)

  return (
    <>
      <CheckWallet>
        {(isOk) => {
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
                onClick={() => setOpen(true)}
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
        }}
      </CheckWallet>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="p-0" showCloseButton={false}>
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
                <Alert variant="default" className="mb-4">
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
                  <Alert variant="default" className="mb-4">
                    <AlertDescription>
                      This requires {parentThreshold} of {parentOwners?.length ?? '?'} parent Safe owner signatures to
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

                {error && (
                  <div className="mt-4">
                    <ErrorMessage error={error}>Error deleting proposer</ErrorMessage>
                  </div>
                )}

                <NetworkWarning action="sign" />
              </>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex-row justify-between p-6">
            {multiSigInitiated ? (
              <Button onClick={onCancel}>Done</Button>
            ) : (
              <>
                <Button data-testid="reject-delete-proposer-btn" size="sm" variant="ghost" onClick={onCancel}>
                  No, keep it
                </Button>

                <CheckWallet checkNetwork={!isLoading}>
                  {(isOk) => (
                    <Button
                      data-testid="confirm-delete-proposer-btn"
                      size="sm"
                      variant="destructive"
                      onClick={onConfirm}
                      disabled={!isOk || isLoading || isParentLoading || !canDelete}
                      className="min-h-9 min-w-[122px]"
                    >
                      {isLoading ? <Spinner className="size-5" /> : 'Yes, delete'}
                    </Button>
                  )}
                </CheckWallet>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const DeleteProposerDialog = madProps(InternalDeleteProposer, {
  wallet: useWallet,
  chainId: useChainId,
  safeAddress: useSafeAddress,
})

export default DeleteProposerDialog
