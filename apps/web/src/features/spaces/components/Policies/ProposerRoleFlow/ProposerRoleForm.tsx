import { useEffect, useRef, type ReactNode } from 'react'
import { FormProvider, useForm, useWatch, type Validate } from 'react-hook-form'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@safe-global/utils/validation/names'
import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
import NameInput from '@/components/common/NameInput'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { ContactSource, useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useIsAdmin } from '../../../hooks/useSpaceMembers'
import SafeAccountSelector from '../SafeAccountSelector'
import type { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import {
  GRANT_INFO_DESCRIPTION,
  GRANT_INFO_TITLE,
  PROPOSER_FIELD_HELPER,
  PROPOSER_NAME_HELPER,
  PROPOSER_NAME_WORKSPACE_HELPER,
} from './constants'

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
  const canSubmit = !isSafeBlocked && formState.isValid

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <TxCard>
          <div className="flex flex-col gap-6">
            <Alert variant="info" className="px-3 py-3 *:data-[slot=alert-description]:text-muted-foreground">
              <AlertSeverityIcon variant="info" />
              <AlertTitle className="text-sm font-normal">{GRANT_INFO_TITLE}</AlertTitle>
              <AlertDescription>{GRANT_INFO_DESCRIPTION}</AlertDescription>
            </Alert>

            <SafeAccountSelector
              accounts={safeAccounts.accounts}
              signersOnly={safeAccounts.signersOnly}
              value={safeAccount}
              onChange={onSafeAccountChange}
              isLoading={safeAccounts.isLoading}
              isError={safeAccounts.isError}
              onRetry={safeAccounts.refetch}
              hasWallet={safeAccounts.hasWallet}
            />

            <div className="flex flex-col gap-1">
              <AddressBookInput name="proposer" label="Proposer" required focused={false} validate={validateProposer} />

              <Typography variant="paragraph-mini" color="muted">
                {PROPOSER_FIELD_HELPER}
              </Typography>
            </div>

            {!isWorkspaceContact && (
              <NameInput
                className="gap-1"
                name="name"
                label="Proposer name"
                placeholder="Type name here"
                helperText={
                  <Typography variant="paragraph-mini" color="muted">
                    {isAdmin ? PROPOSER_NAME_WORKSPACE_HELPER : PROPOSER_NAME_HELPER}
                  </Typography>
                }
                inputSize="hero"
                validateCharset
                minLength={NAME_MIN_LENGTH}
                maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
              />
            )}

            <NetworkWarning action="sign" />

            {errorMessage}
          </div>

          <TxCardActions>
            <DialogActions
              confirmLabel="Submit"
              confirmType="submit"
              confirmTestId="submit-proposer-btn"
              confirmLoading={isSubmitting}
              confirmDisabled={!canSubmit}
              confirmCheckWallet={{ checkNetwork: !isSubmitting, allowProposer: false }}
            />
          </TxCardActions>
        </TxCard>
      </form>
    </FormProvider>
  )
}

export default ProposerRoleForm
