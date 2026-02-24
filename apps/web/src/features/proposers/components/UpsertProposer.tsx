import AddressBookInput from '@/components/common/AddressBookInput'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import NameInput from '@/components/common/NameInput'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ErrorMessage from '@/components/tx/ErrorMessage'
import {
  encodeEIP1271Signature,
  signProposerData,
  signProposerTypedData,
  signProposerTypedDataForSafe,
} from '@/features/proposers/utils/utils'
import { useParentSafeThreshold } from '@/features/proposers/hooks/useParentSafeThreshold'
import { buildDelegationOrigin, createDelegationMessage } from '@/features/proposers/services/delegationMessages'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { addressIsNotCurrentSafe, addressIsNotOwner } from '@safe-global/utils/utils/validation'
import { isEthSignWallet } from '@/utils/wallets'
import { Close } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import {
  useDelegatesPostDelegateV1Mutation,
  useDelegatesPostDelegateV2Mutation,
  type CreateDelegateDto,
  type Delegate,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { type BaseSyntheticEvent, useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm, type Validate } from 'react-hook-form'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

type UpsertProposerProps = {
  onClose: () => void
  onSuccess: () => void
  proposer?: Delegate
}

enum ProposerEntryFields {
  address = 'address',
  name = 'name',
}

type ProposerEntry = {
  [ProposerEntryFields.name]: string
  [ProposerEntryFields.address]: string
}

const UpsertProposer = ({ onClose, onSuccess, proposer }: UpsertProposerProps) => {
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [multiSigInitiated, setMultiSigInitiated] = useState<boolean>(false)
  const [addDelegateV1] = useDelegatesPostDelegateV1Mutation()
  const [addDelegateV2] = useDelegatesPostDelegateV2Mutation()
  const dispatch = useAppDispatch()

  const chainId = useChainId()
  const wallet = useWallet()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const nestedSafeOwners = useNestedSafeOwners()
  const { threshold: parentThreshold, owners: parentOwners } = useParentSafeThreshold()

  const methods = useForm<ProposerEntry>({
    defaultValues: {
      [ProposerEntryFields.address]: proposer?.delegate,
      [ProposerEntryFields.name]: proposer?.label,
    },
    mode: 'onChange',
  })

  const safeOwnerAddresses = useMemo(() => safe.owners.map((owner) => owner.value), [safe.owners])

  const validateAddress = useCallback<Validate<string>>(
    (value) =>
      addressIsNotCurrentSafe(safeAddress, 'Cannot add Safe Account itself as proposer')(value) ??
      addressIsNotOwner(safeOwnerAddresses, 'Cannot add Safe Owner as proposer')(value),
    [safeAddress, safeOwnerAddresses],
  )

  const { handleSubmit, formState } = methods

  const isMultiSigRequired = isNestedSafeOwner && parentThreshold !== undefined && parentThreshold > 1

  const onConfirm = handleSubmit(async (data: ProposerEntry) => {
    if (!wallet) return

    setError(undefined)
    setIsLoading(true)

    try {
      const shouldEthSign = isEthSignWallet(wallet)
      const signer = await getAssertedChainSigner(wallet.provider)
      const parentSafeAddress = isNestedSafeOwner && nestedSafeOwners ? nestedSafeOwners[0] : undefined

      let signature: string
      let delegator: string

      if (parentSafeAddress) {
        if (isMultiSigRequired) {
          // Multi-sig flow: create off-chain message on parent Safe for signature collection
          const eoaSignature = await signProposerTypedDataForSafe(chainId, data.address, parentSafeAddress, signer)
          const delegateTypedData = getDelegateTypedData(chainId, data.address) as TypedData
          const origin = buildDelegationOrigin(proposer ? 'edit' : 'add', data.address, safeAddress, data.name)

          await createDelegationMessage(dispatch, chainId, parentSafeAddress, delegateTypedData, eoaSignature, origin)

          setMultiSigInitiated(true)
          trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)
          setIsLoading(false)
          return
        }

        // Single-sig nested Safe owner: sign and submit immediately
        const eoaSignature = await signProposerTypedDataForSafe(chainId, data.address, parentSafeAddress, signer)
        signature = await encodeEIP1271Signature(parentSafeAddress, eoaSignature)
        delegator = parentSafeAddress
      } else {
        // Direct owner: sign delegate typed data directly
        const eoaSignature = shouldEthSign
          ? await signProposerData(data.address, signer)
          : await signProposerTypedData(chainId, data.address, signer)
        signature = eoaSignature
        delegator = wallet.address
      }

      const createDelegateDto: CreateDelegateDto = {
        delegate: data.address,
        delegator,
        label: data.name,
        signature,
        safe: safeAddress,
      }

      if (shouldEthSign && !parentSafeAddress) {
        await addDelegateV1({ chainId, createDelegateDto }).unwrap()
      } else {
        await addDelegateV2({ chainId, createDelegateDto }).unwrap()
      }

      trackEvent(
        isEditing ? SETTINGS_EVENTS.PROPOSERS.SUBMIT_EDIT_PROPOSER : SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER,
      )

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'add-proposer-success',
          title: 'Proposer added successfully!',
          message: `${shortenAddress(data.address)} can now suggest transactions for this account.`,
        }),
      )

      onSuccess()
    } catch (err) {
      setError(asError(err))
      return
    } finally {
      setIsLoading(false)
    }
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    onConfirm(e)
  }

  const onCancel = () => {
    trackEvent(
      isEditing ? SETTINGS_EVENTS.PROPOSERS.CANCEL_EDIT_PROPOSER : SETTINGS_EVENTS.PROPOSERS.CANCEL_ADD_PROPOSER,
    )
    onClose()
  }

  const isEditing = !!proposer
  const canEdit =
    wallet?.address === proposer?.delegator ||
    (isNestedSafeOwner && nestedSafeOwners?.includes(proposer?.delegator ?? ''))

  if (multiSigInitiated) {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Signature collection initiated
            </Typography>
            <Box flexGrow={1} />
            <IconButton aria-label="close" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            1 of {parentThreshold} signatures collected
          </Alert>

          <Typography variant="body2" mb={2}>
            The delegation request has been created as an off-chain message on your parent Safe. Other owners of the
            parent Safe need to sign it before the proposer can be added.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The other parent Safe owners can find and sign this pending delegation on the proposer settings page of this
            Safe.
          </Typography>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ padding: 3 }}>
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open onClose={onCancel}>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogTitle>
            <Box data-testid="untrusted-token-warning" display="flex" alignItems="center">
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isEditing ? 'Edit' : 'Add'} proposer
              </Typography>

              <Box flexGrow={1} />

              <IconButton aria-label="close" onClick={onCancel} sx={{ marginLeft: 'auto' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <Divider />

          <DialogContent>
            {isMultiSigRequired && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This requires {parentThreshold} of {parentOwners?.length ?? '?'} parent Safe owner signatures to
                complete.
              </Alert>
            )}

            <Box mb={2}>
              <Typography variant="body2">
                You&apos;re about to grant this address the ability to propose transactions. To complete the setup,
                confirm with a signature from your connected wallet.
              </Typography>
            </Box>

            <Alert severity="info">Proposer&apos;s name and address are publicly visible.</Alert>

            <Box my={2}>
              {isEditing ? (
                <Box mb={3}>
                  <EthHashInfo address={proposer?.delegate} showCopyButton hasExplorer shortAddress={false} />
                </Box>
              ) : (
                <AddressBookInput
                  name="address"
                  label="Address"
                  validate={validateAddress}
                  variant="outlined"
                  fullWidth
                  required
                />
              )}
            </Box>

            <Box mb={2}>
              <NameInput name="name" label="Name" required />
            </Box>

            {error && (
              <Box mt={2}>
                <ErrorMessage error={error}>Error adding proposer</ErrorMessage>
              </Box>
            )}

            <NetworkWarning action="sign" />
          </DialogContent>

          <Divider />

          <DialogActions sx={{ padding: 3, justifyContent: 'space-between' }}>
            <Button size="small" variant="text" onClick={onCancel}>
              Cancel
            </Button>

            <CheckWallet checkNetwork={!isLoading} allowProposer={false}>
              {(isOk) => (
                <Button
                  data-testid="submit-proposer-btn"
                  size="small"
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!isOk || isLoading || (isEditing && !canEdit) || !formState.isValid}
                  sx={{ minWidth: '122px', minHeight: '36px' }}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Continue'}
                </Button>
              )}
            </CheckWallet>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}

export default UpsertProposer
