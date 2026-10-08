import type { FormEventHandler, ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { TriangleAlertIcon } from 'lucide-react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { cn } from '@/utils/cn'
import SimilarAddressAlert from './SimilarAddressAlert'
import type { SimilarAddressInfo } from '@/features/myAccounts/hooks/useNonPinnedSafeWarning.types'

export type NameInputSlotProps = {
  'data-testid': string
  name: string
  label: string
  placeholder: string
  autoFocus: boolean
}

export type AddTrustedSafeDialogViewProps = {
  open: boolean
  safeAddress: string
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
  isValid: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
  renderNameInput: (props: NameInputSlotProps) => ReactNode
}

export const AddTrustedSafeDialogView = ({
  open,
  safeAddress,
  hasSimilarAddress,
  similarAddresses,
  isValid,
  onSubmit,
  onCancel,
  renderNameInput,
}: AddTrustedSafeDialogViewProps) => {
  return (
    <ModalDialog
      open={open}
      maxWidth="sm"
      fullWidth
      data-testid="add-trusted-safe-dialog"
      dialogTitle="Add to my accounts"
      hideChainIndicator
    >
      <form onSubmit={onSubmit}>
        <div className="p-6">
          {hasSimilarAddress && <SimilarAddressAlert similarAddresses={similarAddresses} />}

          <div className="mb-4">
            <Typography variant="paragraph-small" color="muted" className="mb-2 block">
              Safe to add
            </Typography>
            <div
              className={cn(
                'bg-background border-border rounded-md',
                hasSimilarAddress ? 'border-2 p-4' : 'border p-4',
              )}
            >
              <EthHashInfo address={safeAddress} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
            </div>
          </div>

          {!hasSimilarAddress && (
            <Typography variant="paragraph-small" color="muted" className="mb-4 block">
              Review the full address above. Continue only if you recognize this Safe and want to add it to your
              accounts.
            </Typography>
          )}

          <div className="mb-4">
            {renderNameInput({
              'data-testid': 'safe-name-input',
              name: 'name',
              label: 'Safe name',
              placeholder: 'Enter a name for this Safe',
              autoFocus: true,
            })}
          </div>
        </div>

        <div className="flex justify-between gap-2 p-6 pt-0">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" data-testid="confirm-add-trusted-safe-button" disabled={!isValid}>
            {hasSimilarAddress && <TriangleAlertIcon className="size-4" />}
            {hasSimilarAddress ? 'I understand, add anyway' : 'Confirm'}
          </Button>
        </div>
      </form>
    </ModalDialog>
  )
}
