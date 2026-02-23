import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import {
  encodeEIP1271Signature,
  signProposerData,
  signProposerTypedData,
  signProposerTypedDataForSafe,
} from '@/features/proposers/utils/utils'
import { useParentSafeThreshold } from '@/features/proposers/hooks/useParentSafeThreshold'
import { buildDelegationOrigin, createDelegationMessage } from '@/features/proposers/services/delegationMessages'
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
import {
  Alert,
  Dialog,
  DialogTitle,
  Typography,
  IconButton,
  Divider,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  SvgIcon,
  Tooltip,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
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
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const nestedSafeOwners = useNestedSafeOwners()
  const { threshold: parentThreshold, owners: parentOwners } = useParentSafeThreshold()

  const isMultiSigRequired = isNestedSafeOwner && parentThreshold !== undefined && parentThreshold > 1

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
      const parentSafeAddress = isNestedSafeOwner && nestedSafeOwners ? nestedSafeOwners[0] : undefined

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
    wallet?.address === proposer.delegate ||
    wallet?.address === proposer.delegator ||
    (isNestedSafeOwner && nestedSafeOwners?.includes(proposer.delegator))

  return (
    <>
      <CheckWallet>
        {(isOk) => (
          <Track {...SETTINGS_EVENTS.PROPOSERS.REMOVE_PROPOSER}>
            <Tooltip
              title={
                isOk && canDelete
                  ? 'Delete proposer'
                  : isOk && !canDelete
                    ? 'Only the owner of this proposer or the proposer itself can delete them'
                    : undefined
              }
            >
              <span>
                <IconButton
                  data-testid="delete-proposer-btn"
                  onClick={() => setOpen(true)}
                  color="error"
                  size="small"
                  disabled={!isOk || !canDelete}
                >
                  <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Track>
        )}
      </CheckWallet>

      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {multiSigInitiated ? 'Signature collection initiated' : 'Delete this proposer?'}
            </Typography>

            <Box flexGrow={1} />

            <IconButton aria-label="close" onClick={onCancel} sx={{ marginLeft: 'auto' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {multiSigInitiated ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                1 of {parentThreshold} signatures collected
              </Alert>

              <Typography variant="body2" mb={2}>
                The removal request has been created as an off-chain message on your parent Safe. Other owners of the
                parent Safe need to sign it before the proposer can be removed.
              </Typography>

              <Typography variant="body2" color="text.secondary">
                The other parent Safe owners can find and sign this pending delegation on the proposer settings page of
                this Safe.
              </Typography>
            </>
          ) : (
            <>
              {isMultiSigRequired && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This requires {parentThreshold} of {parentOwners?.length ?? '?'} parent Safe owner signatures to
                  complete.
                </Alert>
              )}

              <Box mb={2}>
                <Typography>
                  Deleting this proposer will permanently remove the address, and it won&apos;t be able to suggest
                  transactions anymore.
                  <br />
                  <br />
                  To complete this action, confirm it with your connected wallet signature.
                </Typography>
              </Box>

              {error && (
                <Box mt={2}>
                  <ErrorMessage error={error}>Error deleting proposer</ErrorMessage>
                </Box>
              )}

              <NetworkWarning action="sign" />
            </>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ padding: 3, justifyContent: 'space-between' }}>
          {multiSigInitiated ? (
            <Button variant="contained" onClick={onCancel}>
              Done
            </Button>
          ) : (
            <>
              <Button data-testid="reject-delete-proposer-btn" size="small" variant="text" onClick={onCancel}>
                No, keep it
              </Button>

              <CheckWallet checkNetwork={!isLoading}>
                {(isOk) => (
                  <Button
                    data-testid="confirm-delete-proposer-btn"
                    size="small"
                    variant="danger"
                    onClick={onConfirm}
                    disabled={!isOk || isLoading || !canDelete}
                    sx={{
                      minWidth: '122px',
                      minHeight: '36px',
                    }}
                  >
                    {isLoading ? <CircularProgress size={20} /> : 'Yes, delete'}
                  </Button>
                )}
              </CheckWallet>
            </>
          )}
        </DialogActions>
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
