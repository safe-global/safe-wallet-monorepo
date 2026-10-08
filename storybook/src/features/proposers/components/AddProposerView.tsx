import type { BaseSyntheticEvent, ComponentProps, ReactNode } from 'react'
import type AddressBookInput from '@/components/common/AddressBookInput'
import type NameInput from '@/components/common/NameInput'
import DialogActions from '@/components/common/DialogActions'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import SignerSelector from '@/components/common/SignerSelector'
import { SMART_CONTRACT_PROPOSER_INFO } from '@/features/proposers/constants'
import { XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import SignatureIcon from '@/public/images/transactions/signature.svg'

export type AddressInputSlotProps = Pick<
  ComponentProps<typeof AddressBookInput>,
  'name' | 'label' | 'variant' | 'fullWidth' | 'required'
>
export type NameInputSlotProps = Pick<ComponentProps<typeof NameInput>, 'name' | 'label' | 'required' | 'inputSize'>

export type AddProposerViewProps = {
  multiSigInitiated: boolean
  isMultiSigRequired: boolean
  parentThreshold?: number
  parentOwnersCount?: number
  isLoading: boolean
  isParentLoading: boolean
  isValid: boolean
  isSmartContractError: boolean
  hasError: boolean
  blockedMessage?: ReactNode
  delegatorOptions: string[]
  effectiveDelegator?: string
  onDelegatorChange: (address: string) => void
  onClose: () => void
  onCancel: () => void
  onSubmit: (e: BaseSyntheticEvent) => void
  renderAddressInput: (props: AddressInputSlotProps) => ReactNode
  renderNameInput: (props: NameInputSlotProps) => ReactNode
  renderErrorMessage: (fallback: string) => ReactNode
}

export const AddProposerView = ({
  multiSigInitiated,
  isMultiSigRequired,
  parentThreshold,
  parentOwnersCount,
  isLoading,
  isParentLoading,
  isValid,
  isSmartContractError,
  hasError,
  blockedMessage,
  delegatorOptions,
  effectiveDelegator,
  onDelegatorChange,
  onClose,
  onCancel,
  onSubmit,
  renderAddressInput,
  renderNameInput,
  renderErrorMessage,
}: AddProposerViewProps) => {
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
            <Alert variant="info" className="mb-4">
              <AlertSeverityIcon variant="info" />
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
        <form onSubmit={onSubmit}>
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle data-testid="untrusted-token-warning">Add proposer</DialogTitle>

            <Button variant="ghost" size="icon-sm" aria-label="close" onClick={onCancel}>
              <XIcon />
            </Button>
          </DialogHeader>

          <Separator />

          <div className="p-4">
            {isMultiSigRequired && (
              <Alert variant="info" className="mb-4">
                <AlertSeverityIcon variant="info" />
                <AlertDescription>
                  This requires {parentThreshold} of {parentOwnersCount ?? '?'} parent Safe owner signatures to
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

            <Alert variant="info">
              <AlertSeverityIcon variant="info" />
              <AlertDescription>
                The proposer&apos;s address is publicly visible. The name is saved on this device only.
              </AlertDescription>
            </Alert>

            <div className="my-4">
              {renderAddressInput({
                name: 'address',
                label: 'Address',
                variant: 'outlined',
                fullWidth: true,
                required: true,
              })}
            </div>

            <div className="mb-4">
              {renderNameInput({ name: 'name', label: 'Name', required: true, inputSize: 'hero' })}
            </div>

            {hasError && <div className="mt-4">{renderErrorMessage('Error adding proposer')}</div>}

            {blockedMessage && <div className="mt-4">{blockedMessage}</div>}

            <NetworkWarning action="sign" />

            {delegatorOptions.length > 1 && (
              <div className="mt-4">
                <Typography variant="h4" className="mb-2 flex items-center gap-2">
                  <SignatureIcon className="size-4" />
                  Delegate as
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span tabIndex={0} className="inline-flex">
                          <InfoIcon className="size-4 text-[var(--color-border-main)]" />
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
                  onChange={onDelegatorChange}
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
              confirmDisabled={isParentLoading || !isValid}
              confirmCheckWallet={{ checkNetwork: !isLoading, allowProposer: false }}
              confirmTooltip={isSmartContractError ? SMART_CONTRACT_PROPOSER_INFO : undefined}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
