import AddressBookInput from '@/components/common/AddressBookInput'
import NameInput from '@/components/common/NameInput'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import {
  addressIsNotSmartContract,
  encodeEIP1271Signature,
  usesV1DelegateEndpoint,
  signProposerDelegation,
  signProposerTypedDataForSafe,
} from '@/features/proposers/utils/utils'
import { PROPOSER_LABEL_PLACEHOLDER, SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { useDelegatorSelection } from '../hooks/useDelegatorSelection'
import { buildDelegationOrigin, createDelegationMessage } from '../services/delegationMessages'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { useDelegateMutations } from '@safe-global/utils/hooks/useDelegateMutations'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { addressIsNotCurrentSafe, addressIsNotOwner, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import {
  useDelegatesPostDelegateV1Mutation,
  type CreateDelegateDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { type BaseSyntheticEvent, useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm, type Validate } from 'react-hook-form'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AddProposerView } from '@views/features/proposers/components/AddProposerView'

type AddProposerProps = {
  onClose: () => void
  onSuccess: () => void
}

enum ProposerEntryFields {
  address = 'address',
  name = 'name',
}

type ProposerEntry = {
  [ProposerEntryFields.name]: string
  [ProposerEntryFields.address]: string
}

const AddProposer = ({ onClose, onSuccess }: AddProposerProps) => {
  const [error, setError] = useState<Error>()
  const [blockedReason, setBlockedReason] = useState<string>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [multiSigInitiated, setMultiSigInitiated] = useState<boolean>(false)
  const [addDelegateV1] = useDelegatesPostDelegateV1Mutation()
  const { addDelegate } = useDelegateMutations()
  const dispatch = useAppDispatch()

  const chainId = useChainId()
  const chain = useCurrentChain()
  const wallet = useWallet()
  const safeAddress = useSafeAddress()
  const { safe } = useSafeInfo()

  const {
    delegatorOptions,
    setSelectedDelegator,
    effectiveDelegator,
    parentSafeAddress,
    parentThreshold,
    parentOwners,
    isMultiSigRequired,
    isParentLoading,
  } = useDelegatorSelection()

  const methods = useForm<ProposerEntry>({
    defaultValues: {
      [ProposerEntryFields.address]: '',
      [ProposerEntryFields.name]: '',
    },
    mode: 'onChange',
  })

  const safeOwnerAddresses = useMemo(() => safe.owners.map((owner) => owner.value), [safe.owners])

  const validateAddress = useCallback<Validate<string>>(
    async (value) => {
      const notReserved = addressIsNotReserved('This proposer address is not valid')
      const notCurrentSafe = addressIsNotCurrentSafe(safeAddress, 'Cannot add Safe account itself as proposer')
      const notOwner = addressIsNotOwner(safeOwnerAddresses, 'Cannot add Safe Owner as proposer')
      const notSmartContract = addressIsNotSmartContract(chainId, SMART_CONTRACT_PROPOSER_ERROR)

      return notReserved(value) ?? notCurrentSafe(value) ?? notOwner(value) ?? (await notSmartContract(value))
    },
    [safeAddress, safeOwnerAddresses, chainId],
  )

  const { handleSubmit, formState } = methods

  const addressError = formState.errors[ProposerEntryFields.address]?.message
  const isSmartContractError = addressError === SMART_CONTRACT_PROPOSER_ERROR

  const onConfirm = handleSubmit(async (data: ProposerEntry) => {
    if (!wallet || !chain) return

    const name = sanitizeName(data.name)

    // The name is deliberately never sent to the backend; it lives only in this device's address book.
    const saveNameLocally = () =>
      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: data.address, name }))

    setError(undefined)
    setBlockedReason(undefined)
    setIsLoading(true)

    try {
      // Backstop in case the field validator has not settled by the time the form is submitted
      const smartContractError = await addressIsNotSmartContract(chainId, SMART_CONTRACT_PROPOSER_ERROR)(data.address)
      if (smartContractError) {
        setBlockedReason(smartContractError)
        return
      }

      const useV1Endpoint = usesV1DelegateEndpoint(chain, wallet)
      const signer = await getAssertedChainSigner(wallet.provider)

      let signature: string
      let delegator: string

      if (parentSafeAddress) {
        if (isMultiSigRequired) {
          // Multi-sig flow: create off-chain message on parent Safe for signature collection
          const eoaSignature = await signProposerTypedDataForSafe(
            chain,
            data.address,
            parentSafeAddress,
            safeAddress,
            'add',
            signer,
          )
          const delegateTypedData = getDelegateTypedData(chain, data.address, safeAddress, 'add')
          const origin = buildDelegationOrigin('add', data.address, safeAddress)

          await createDelegationMessage(dispatch, chainId, parentSafeAddress, delegateTypedData, eoaSignature, origin)

          saveNameLocally()
          setMultiSigInitiated(true)
          trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)
          setIsLoading(false)
          return
        }

        // Single-sig nested Safe owner: sign and submit immediately
        const eoaSignature = await signProposerTypedDataForSafe(
          chain,
          data.address,
          parentSafeAddress,
          safeAddress,
          'add',
          signer,
        )
        signature = await encodeEIP1271Signature(parentSafeAddress, eoaSignature)
        delegator = parentSafeAddress
      } else {
        signature = await signProposerDelegation({
          chain,
          wallet,
          proposerAddress: data.address,
          safeAddress,
          action: 'add',
          signer,
        })
        delegator = wallet.address
      }

      const createDelegateDto: CreateDelegateDto = {
        delegate: data.address,
        delegator,
        label: PROPOSER_LABEL_PLACEHOLDER,
        signature,
        safe: safeAddress,
      }

      if (useV1Endpoint && !parentSafeAddress) {
        await addDelegateV1({ chainId, createDelegateDto }).unwrap()
      } else {
        await addDelegate({ chain, createDelegateDto })
      }

      saveNameLocally()

      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)

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
    trackEvent(SETTINGS_EVENTS.PROPOSERS.CANCEL_ADD_PROPOSER)
    onClose()
  }

  return (
    <FormProvider {...methods}>
      <AddProposerView
        multiSigInitiated={multiSigInitiated}
        isMultiSigRequired={isMultiSigRequired}
        parentThreshold={parentThreshold}
        parentOwnersCount={parentOwners?.length}
        isLoading={isLoading}
        isParentLoading={isParentLoading}
        isValid={formState.isValid}
        isSmartContractError={isSmartContractError}
        hasError={!!error}
        blockedMessage={blockedReason && <ErrorMessage>{blockedReason}</ErrorMessage>}
        delegatorOptions={delegatorOptions}
        effectiveDelegator={effectiveDelegator}
        onDelegatorChange={setSelectedDelegator}
        onClose={onClose}
        onCancel={onCancel}
        onSubmit={onSubmit}
        renderAddressInput={(props) => <AddressBookInput {...props} validate={validateAddress} />}
        renderNameInput={(props) => <NameInput {...props} />}
        renderErrorMessage={(fallback) =>
          error && <ErrorMessage error={error}>{getProposerErrorText(error, fallback)}</ErrorMessage>
        }
      />
    </FormProvider>
  )
}

export default AddProposer
