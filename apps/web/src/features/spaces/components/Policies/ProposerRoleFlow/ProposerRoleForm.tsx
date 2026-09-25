import { useEffect, type ReactNode } from 'react'
import { FormProvider, useForm, type Validate } from 'react-hook-form'
import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
import NameInput from '@/components/common/NameInput'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import SafeAccountSelector from '../SafeAccountSelector'
import type { useEligibleSafeAccounts } from '../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import { GRANT_INFO_DESCRIPTION, GRANT_INFO_TITLE, PROPOSER_FIELD_HELPER, PROPOSER_NAME_HELPER } from './constants'

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
  const { trigger, getValues, formState } = methods

  useEffect(() => {
    if (getValues('proposer')) void trigger('proposer')
  }, [safeAccount, validateProposer, trigger, getValues])

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
              value={safeAccount}
              onChange={onSafeAccountChange}
              isLoading={safeAccounts.isLoading}
              isError={safeAccounts.isError}
              onRetry={safeAccounts.refetch}
              hasWallet={safeAccounts.hasWallet}
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
