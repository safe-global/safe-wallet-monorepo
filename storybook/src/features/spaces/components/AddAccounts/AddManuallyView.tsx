import type { FormEvent, ReactNode } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import ModalDialog from '@/components/common/ModalDialog'
import css from './styles.module.css'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type AddManuallyAddressInputSlotProps = {
  'data-testid': string
  label: string
}

export type AddManuallyViewProps = {
  disabled: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isValid: boolean
  chainId: string
  chainIds: string[]
  onChainChange: (value: string | null) => void
  renderAddressInput: (props: AddManuallyAddressInputSlotProps) => ReactNode
}

export const AddManuallyView = ({
  disabled,
  open,
  onOpen,
  onClose,
  onSubmit,
  isValid,
  chainId,
  chainIds,
  onChainChange,
  renderAddressInput,
}: AddManuallyViewProps) => {
  return (
    <>
      <Button
        type="button"
        data-testid="add-manually-button"
        variant="secondary"
        size="lg"
        disabled={disabled}
        onClick={onOpen}
        className="w-full"
      >
        <Plus className="size-4" />
        Add manually
      </Button>
      <ModalDialog
        open={open}
        dialogTitle="Add safe account"
        onClose={onClose}
        hideChainIndicator
        forceBackdrop
        PaperProps={{ sx: { maxWidth: '760px' } }}
      >
        <form onSubmit={onSubmit}>
          <div className="px-6 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {renderAddressInput({ 'data-testid': 'add-address-input', label: 'Safe account' })}
              <div data-testid="network-selector" className={css.selectWrapper}>
                <Select value={chainId} onValueChange={onChainChange}>
                  {/* eslint-disable-next-line no-restricted-syntax -- h-full/w-full fill the row cell (layout); skin is variant="ghost" */}
                  <SelectTrigger variant="ghost" className="h-full w-full">
                    <SelectValue>{(value) => <ChainIndicator chainId={value} />}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {chainIds.map((id) => (
                      <SelectItem data-testid="network-item" key={id} value={id}>
                        <ChainIndicator chainId={id} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button data-testid="add-space-account-manually-button" disabled={!isValid} type="submit">
              Add
            </Button>
          </div>
        </form>
      </ModalDialog>
    </>
  )
}
