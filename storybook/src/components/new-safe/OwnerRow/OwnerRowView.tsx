import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { largeFormFieldRowClassName } from '@/components/common/formFieldStyles'
import DeleteIcon from '@/public/images/common/delete.svg'
import css from './styles.module.css'
import classNames from 'classnames'

export type OwnerNameInputSlotProps = {
  'data-testid': string
  label: string
  InputLabelProps: { shrink: boolean }
  inputSize: 'hero'
  variant: 'surface'
  placeholder: string
  helperText: ReactNode
  InputProps: { endAdornment: ReactNode }
}

export type OwnerRowViewProps = {
  index: number
  removable: boolean
  readOnly: boolean
  walletIsOwner: boolean
  ens?: string
  resolving: boolean
  renderNameInput: (props: OwnerNameInputSlotProps) => ReactNode
  renderAddressInput: (props: { label: string }) => ReactNode
  addressInfo: ReactNode
  onRemove: () => void
}

export function OwnerRowView({
  index,
  removable,
  readOnly,
  walletIsOwner,
  ens,
  resolving,
  renderNameInput,
  renderAddressInput,
  addressInfo,
  onRemove,
}: OwnerRowViewProps): ReactElement {
  return (
    <div
      // `items-start` keeps both label-above-control fields on one baseline despite the wallet caption
      className={classNames('mb-6 grid grid-cols-12 items-start gap-6', {
        [css.helper]: walletIsOwner,
      })}
    >
      <div className={readOnly ? 'col-span-12 md:col-span-5' : 'col-span-12 md:col-span-4'}>
        <div className="flex w-full flex-col">
          {renderNameInput({
            'data-testid': 'owner-name',
            label: 'Signer name',
            InputLabelProps: { shrink: true },
            inputSize: 'hero',
            variant: 'surface',
            placeholder: ens || `Signer ${index + 1}`,
            helperText: walletIsOwner && 'Your connected wallet',
            InputProps: {
              endAdornment: resolving && <Spinner className="size-5" />,
            },
          })}
        </div>
      </div>
      <div
        className={classNames(
          'col-span-11 md:col-span-7',
          readOnly && `${largeFormFieldRowClassName} mt-[calc(0.875rem*1.375+0.75rem)]`,
        )}
      >
        {readOnly ? addressInfo : <div className="flex w-full flex-col">{renderAddressInput({ label: 'Signer' })}</div>}
      </div>
      {!readOnly && (
        // Offset past the label so the button centres on the 66px field, not the growing cell
        <div className="col-span-1 -ml-4 mt-[calc(0.875rem*1.375+0.75rem)] flex h-[66px] shrink-0 items-center">
          {removable && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="remove-owner-btn"
              onClick={onRemove}
              aria-label="Remove signer"
            >
              <DeleteIcon />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
