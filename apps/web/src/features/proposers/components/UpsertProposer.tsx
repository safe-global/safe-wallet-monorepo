import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
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
import { useDelegatorSelection } from '../hooks/useDelegatorSelection'
import { buildDelegationOrigin, createDelegationMessage } from '../services/delegationMessages'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { addressIsNotCurrentSafe, addressIsNotOwner } from '@safe-global/utils/utils/validation'
import { isEthSignWallet } from '@/utils/wallets'
import { XIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
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
import SignerSelector from '@/components/common/SignerSelector'
import InfoIcon from '@/public/images/notifications/info.svg'
import SignatureIcon from '@/public/images/transactions/signature.svg'
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

  const isEditing = !!proposer

  const {
    delegatorOptions,
    setSelectedDelegator,
    effectiveDelegator,
    parentSafeAddress,
    parentThreshold,
    parentOwners,
    isMultiSigRequired,
    isParentLoading,
    canEdit,
  } = useDelegatorSelection(proposer)

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
      addressIsNotCurrentSafe(safeAddress, 'Cannot add Safe account itself as proposer')(value) ??
      addressIsNotOwner(safeOwnerAddresses, 'Cannot add Safe Owner as proposer')(value),
    [safeAddress, safeOwnerAddresses],
  )

  const { handleSubmit, formState } = methods

  const onConfirm = handleSubmit(async (data: ProposerEntry) => {
    if (!wallet) return

    const name = sanitizeName(data.name)

    setError(undefined)
    setIsLoading(true)

    try {
      const shouldEthSign = isEthSignWallet(wallet)
      const signer = await getAssertedChainSigner(wallet.provider)

      let signature: string
      let delegator: string

      if (parentSafeAddress) {
        if (isMultiSigRequired) {
          // Multi-sig flow: create off-chain message on parent Safe for signature collection
          const eoaSignature = await signProposerTypedDataForSafe(chainId, data.address, parentSafeAddress, signer)
          const delegateTypedData = getDelegateTypedData(chainId, data.address) as TypedData
          const origin = buildDelegationOrigin(proposer ? 'edit' : 'add', data.address, safeAddress, name)

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
        label: name,
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

  if (multiSigInitiated) {
    return (
      <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent padding="none" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Signature collection initiated</DialogTitle>
            <Button variant="ghost" size="icon-sm" aria-label="close" onClick={onClose}>
              <XIcon />
            </Button>
          </DialogHeader>

          <Separator />

          <div className="p-4">
            <Alert variant="default" className="mb-4">
              <AlertDescription>1 of {parentThreshold} signatures collected</AlertDescription>
            </Alert>

            <Typography variant="paragraph-small" className="mb-4 block">
              The delegation request has been created as an off-chain message on your parent Safe. Other owners of the
              parent Safe need to sign it before the proposer can be added.
            </Typography>

            <Typography variant="paragraph-small" color="muted">
              The other parent Safe owners can find and sign this pending delegation on the proposer settings page of
              this Safe.
            </Typography>
          </div>

          <Separator />

          {/* eslint-disable-next-line no-restricted-syntax -- p-6: bespoke footer padding around DialogActions (item A), no token */}
          <DialogFooter className="p-6">
            <DialogActions confirmLabel="Done" onConfirm={onClose} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent padding="none" showCloseButton={false}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <DialogHeader className="flex-row items-center justify-between">
              <DialogTitle data-testid="untrusted-token-warning">{isEditing ? 'Edit' : 'Add'} proposer</DialogTitle>

              <Button variant="ghost" size="icon-sm" aria-label="close" onClick={onCancel}>
                <XIcon />
              </Button>
            </DialogHeader>

            <Separator />

            <div className="p-4">
              {isMultiSigRequired && (
                <Alert variant="default" className="mb-4">
                  <AlertDescription>
                    This requires {parentThreshold} of {parentOwners?.length ?? '?'} parent Safe owner signatures to
                    complete.
                  </AlertDescription>
                </Alert>
              )}

              <div className="mb-4">
                <Typography variant="paragraph-small">
                  You&apos;re about to grant this address the ability to propose transactions. To complete the setup,
                  confirm with a signature from your connected wallet.
                </Typography>
              </div>

              <Alert variant="default">
                <AlertDescription>Proposer&apos;s name and address are publicly visible.</AlertDescription>
              </Alert>

              <div className="my-4">
                {isEditing ? (
                  <div className="mb-6">
                    <EthHashInfo address={proposer?.delegate} showCopyButton hasExplorer shortAddress={false} />
                  </div>
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
              </div>

              <div className="mb-4">
                <NameInput name="name" label="Name" required />
              </div>

              {error && (
                <div className="mt-4">
                  <ErrorMessage error={error}>Error adding proposer</ErrorMessage>
                </div>
              )}

              <NetworkWarning action="sign" />

              {!isEditing && delegatorOptions.length > 1 && (
                <div className="mt-4">
                  <Typography variant="h4" className="mb-2 flex items-center gap-2">
                    <SignatureIcon className="size-4" />
                    Delegate as
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span tabIndex={0} className="inline-flex">
                            <InfoIcon className="size-4 text-border" />
                          </span>
                        }
                      />
                      <TooltipContent>
                        Your connected wallet controls multiple Safe accounts that are owners of this Safe. Select which
                        account to create the proposer under.
                      </TooltipContent>
                    </Tooltip>
                  </Typography>

                  <SignerSelector
                    options={delegatorOptions}
                    value={effectiveDelegator}
                    onChange={setSelectedDelegator}
                    label="Delegator account"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* eslint-disable-next-line no-restricted-syntax -- p-6: bespoke footer padding around DialogActions (item A), no token */}
            <DialogFooter className="p-6">
              <DialogActions
                onCancel={onCancel}
                confirmLabel="Continue"
                confirmTestId="submit-proposer-btn"
                confirmType="submit"
                confirmLoading={isLoading}
                confirmDisabled={isParentLoading || (isEditing && !canEdit) || !formState.isValid}
                confirmCheckWallet={{ checkNetwork: !isLoading, allowProposer: false }}
              />
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

export default UpsertProposer
