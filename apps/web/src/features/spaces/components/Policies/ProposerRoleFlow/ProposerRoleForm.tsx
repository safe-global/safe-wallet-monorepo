import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { FormProvider, useForm, useWatch, type Validate } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import AddressBookInput from '@/components/common/AddressBookInput'
import NameInput from '@/components/common/NameInput'
import { ContactSource, useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useIsAdmin } from '../../../hooks/useSpaceMembers'
import ParentSafeWalletNotice, { type ParentSafeWalletNoticeProps } from '../components/ParentSafeWalletNotice'
import SafeAccountSelector from '../SafeAccountSelector'
import {
  getNestedSafesNoticeText,
  NESTED_SAFES_NOTICE_TITLE,
} from '@views/features/spaces/components/Policies/SafeAccountSelector/constants'
import type { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import { ProposerRoleFormView } from '@views/features/spaces/components/Policies/ProposerRoleFlow/ProposerRoleFormView'

export type ProposerRoleFormValues = {
  proposer: string
  name: string
}

export type ProposerRoleFormProps = {
  onSubmit: (values: ProposerRoleFormValues) => void
  safeAccounts: ReturnType<typeof useEligibleSafeAccounts>
  /** `${chainId}:${address}` */
  safeAccount?: string
  onSafeAccountChange: (value: string) => void
  validateProposer?: Validate<string>
  defaultValues?: Partial<ProposerRoleFormValues>
  isSubmitting?: boolean
  errorMessage?: ReactNode
  parentSafeWallet?: ParentSafeWalletNoticeProps
}

const ProposerRoleForm = ({
  onSubmit,
  safeAccounts,
  safeAccount,
  onSafeAccountChange,
  validateProposer,
  defaultValues,
  isSubmitting = false,
  errorMessage,
  parentSafeWallet,
}: ProposerRoleFormProps) => {
  const methods = useForm<ProposerRoleFormValues>({
    defaultValues: { proposer: '', name: '', ...defaultValues },
    mode: 'onChange',
  })
  const { trigger, getValues, setValue, formState, control } = methods
  const chainId = useChainId()
  const isAdmin = useIsAdmin()
  const { get: getContact } = useMergedAddressBooks(chainId)
  const proposer = useWatch({ control, name: 'proposer' })
  const contact = getContact(proposer, chainId)
  const contactName = contact?.name
  const isWorkspaceContact = contact?.source === ContactSource.space
  const autofilledName = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (getValues('proposer')) void trigger('proposer')
  }, [safeAccount, validateProposer, trigger, getValues])

  // Every newly picked contact brings its own name; clear it again once the address matches none.
  // Keyed on the proposer too: two contacts can share a name while the field holds an edited one.
  useEffect(() => {
    if (contactName) setValue('name', contactName, { shouldValidate: true })
    else if (autofilledName.current && getValues('name') === autofilledName.current) setValue('name', '')
    autofilledName.current = contactName
  }, [proposer, contactName, setValue, getValues])

  const selectedSafe = findSafeAccount(safeAccounts.accounts, safeAccount)
  const isSafeBlocked = !selectedSafe || Boolean(selectedSafe.ineligibleReason)
  const canSubmit = !isSafeBlocked && !parentSafeWallet && formState.isValid

  // The picked Safe stays even when typed as its own proposer, so the field keeps it and validation explains why.
  const accountOptions = useMemo(
    () =>
      proposer && !sameAddress(proposer, selectedSafe?.address)
        ? safeAccounts.accounts.filter((entry) => !sameAddress(entry.address, proposer))
        : safeAccounts.accounts,
    [safeAccounts.accounts, proposer, selectedSafe?.address],
  )

  return (
    <FormProvider {...methods}>
      <ProposerRoleFormView
        onSubmit={methods.handleSubmit(onSubmit)}
        safeAccountSelector={
          <SafeAccountSelector
            accounts={accountOptions}
            signersOnly={safeAccounts.signersOnly}
            value={safeAccount}
            onChange={onSafeAccountChange}
            isLoading={safeAccounts.isLoading}
            isError={safeAccounts.isError}
            onRetry={safeAccounts.refetch}
            hasWallet={safeAccounts.hasWallet}
            notice={{ title: NESTED_SAFES_NOTICE_TITLE, description: getNestedSafesNoticeText('proposers') }}
          />
        }
        parentSafeWalletNotice={parentSafeWallet && <ParentSafeWalletNotice {...parentSafeWallet} />}
        renderProposerInput={({ label }) => (
          <AddressBookInput
            name="proposer"
            label={label}
            required
            focused={false}
            validate={validateProposer}
            excludeAddresses={selectedSafe ? [selectedSafe.address] : undefined}
          />
        )}
        showNameInput={!isWorkspaceContact}
        renderNameInput={(nameInputProps) => (
          <NameInput
            {...nameInputProps}
            name="name"
            validateCharset
            minLength={NAME_MIN_LENGTH}
            maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
          />
        )}
        isAdmin={isAdmin}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />
    </FormProvider>
  )
}

export default ProposerRoleForm
