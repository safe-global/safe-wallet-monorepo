import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Info, WalletCards } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import AddressBookInput from '@/components/common/AddressBookInput'
import DialogActions from '@/components/common/DialogActions'
import ExternalLink from '@/components/common/ExternalLink'
import NameInput from '@/components/common/NameInput'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeAccountSelector from '../SafeAccountSelector'
import type { SafeAccountEntry } from '../SafeAccountSelector/types'

export type ProposerRoleFormValues = {
  proposer: string
  name: string
}

export type ProposerRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ProposerRoleFormValues) => void
  /** Already filtered and grouped — see `useEligibleSafeAccounts`. */
  accounts: SafeAccountEntry[]
  /** `${chainId}:${address}` */
  safeAccount?: string
  onSafeAccountChange: (value: string) => void
  defaultValues?: Partial<ProposerRoleFormValues>
  accountsLoading?: boolean
  accountsError?: boolean
  onAccountsRetry?: () => void
  hasWallet?: boolean
  isSubmitting?: boolean
  /** Surfaced above the form — e.g. a failed signature. */
  errorMessage?: ReactNode
}

const ProposerRoleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  accounts,
  safeAccount,
  onSafeAccountChange,
  defaultValues,
  accountsLoading = false,
  accountsError = false,
  onAccountsRetry,
  hasWallet = true,
  isSubmitting = false,
  errorMessage,
}: ProposerRoleDialogProps) => {
  const methods = useForm<ProposerRoleFormValues>({
    defaultValues: { proposer: '', name: '', ...defaultValues },
    mode: 'onChange',
  })

  const canSubmit = Boolean(safeAccount) && methods.formState.isValid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent padding="none" showCloseButton={false}>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-background-light-hover)]">
                  <WalletCards className="size-4 text-badge-dot-success" aria-hidden />
                </div>

                <div className="flex flex-col gap-1">
                  <DialogTitle className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
                    Proposer role
                    <ExternalLink
                      href={HelpCenterArticle.PROPOSERS}
                      noIcon
                      aria-label="Learn more about proposers"
                      className="flex text-muted-foreground no-underline hover:text-foreground"
                    >
                      <Info className="size-4 translate-y-px" aria-hidden />
                    </ExternalLink>
                  </DialogTitle>

                  <Typography variant="paragraph-small" color="muted">
                    Let teammates without signing rights propose transactions.
                  </Typography>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-6 px-4 pb-4">
              <Alert variant="info" className="px-3 py-3 *:data-[slot=alert-description]:text-muted-foreground">
                <AlertSeverityIcon variant="info" />
                <AlertTitle className="text-sm font-normal">
                  You are about to grant the ability to propose transactions.
                </AlertTitle>

                <AlertDescription>
                  To complete the setup, confirm with a signature from your connected wallet.
                </AlertDescription>
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
                <AddressBookInput name="proposer" label="Proposer" required />

                <Typography variant="paragraph-mini" color="muted">
                  The beneficiary that will have the ability to propose transactions, publicly visible
                </Typography>
              </div>

              <NameInput
                className="gap-1"
                name="name"
                label="Proposer name"
                placeholder="Type name here"
                helperText={
                  <Typography variant="paragraph-mini" color="muted">
                    Only you can see this name. Everyone else sees the address.
                  </Typography>
                }
                inputSize="hero"
              />

              {errorMessage}
            </div>

            <DialogActions
              confirmLabel="Submit"
              confirmType="submit"
              confirmLoading={isSubmitting}
              confirmDisabled={!canSubmit}
              className="p-4"
            />
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}

export default ProposerRoleDialog
