import { useEffect, type ReactNode } from 'react'
import { FormProvider, useForm, type Validate } from 'react-hook-form'
import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
import NameInput from '@/components/common/NameInput'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import SafeAccountSelector from '../SafeAccountSelector'
import type { SafeAccountEntry } from '../SafeAccountSelector/types'
import { GRANT_INFO_DESCRIPTION, GRANT_INFO_TITLE, PROPOSER_FIELD_HELPER, PROPOSER_NAME_HELPER } from './constants'

export type ProposerRoleFormValues = {
  proposer: string
  name: string
}

export type ProposerRoleFormProps = {
  onSubmit: (values: ProposerRoleFormValues) => void
  /** Already filtered and grouped — see `useEligibleSafeAccounts`. */
  accounts: SafeAccountEntry[]
  /** `${chainId}:${address}` */
  safeAccount?: string
  onSafeAccountChange: (value: string) => void
  /** Runs against the picked Safe: reserved, the Safe itself, owners, existing proposers, contracts. */
  validateProposer?: Validate<string>
  defaultValues?: Partial<ProposerRoleFormValues>
  accountsLoading?: boolean
  accountsError?: boolean
  onAccountsRetry?: () => void
  hasWallet?: boolean
  isSubmitting?: boolean
  /** Surfaced above the actions — e.g. a failed signature. */
  errorMessage?: ReactNode
}

const ProposerRoleForm = ({
  onSubmit,
  accounts,
  safeAccount,
  onSafeAccountChange,
  validateProposer,
  defaultValues,
  accountsLoading = false,
  accountsError = false,
  onAccountsRetry,
  hasWallet = true,
  isSubmitting = false,
  errorMessage,
}: ProposerRoleFormProps) => {
  const methods = useForm<ProposerRoleFormValues>({
    defaultValues: { proposer: '', name: '', ...defaultValues },
    mode: 'onChange',
  })
  const { trigger, getFieldState, formState } = methods

  // The owner and existing-proposer rules depend on the picked Safe, so a typed address is re-checked when it changes.
  useEffect(() => {
    if (getFieldState('proposer').isDirty) void trigger('proposer')
  }, [safeAccount, trigger, getFieldState])

  const canSubmit = Boolean(safeAccount) && formState.isValid

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
              accounts={accounts}
              value={safeAccount}
              onChange={onSafeAccountChange}
              isLoading={accountsLoading}
              isError={accountsError}
              onRetry={onAccountsRetry}
              hasWallet={hasWallet}
            />

            <div className="flex flex-col gap-1">
              <AddressBookInput name="proposer" label="Proposer" required validate={validateProposer} />

              <Typography variant="paragraph-mini" color="muted">
                {PROPOSER_FIELD_HELPER}
              </Typography>
            </div>

            <NameInput
              className="gap-1"
              name="name"
              label="Proposer name"
              placeholder="Type name here"
              helperText={
                <Typography variant="paragraph-mini" color="muted">
                  {PROPOSER_NAME_HELPER}
                </Typography>
              }
              inputSize="hero"
            />

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
