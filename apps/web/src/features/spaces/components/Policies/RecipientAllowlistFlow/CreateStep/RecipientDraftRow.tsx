import { useState, type FormEvent, type KeyboardEvent, type ReactElement } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Check, X } from 'lucide-react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Button } from '@safe-global/views/components/ui/button'
import { Input } from '@safe-global/views/components/ui/input'
import { Typography } from '@safe-global/views/components/ui/typography'
import { validateAllowlistRecipient } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/utils/allowlistForm'
import type { AllowlistRecipient } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import {
  IDENTICON_SIZE,
  RECIPIENT_ADD_CONFIRM_LABEL,
  RECIPIENT_ADDRESS_LABEL,
  RECIPIENT_FALLBACK_NAME,
  RECIPIENT_NAME_LABEL,
  RECIPIENT_NEXT_LABEL,
  RECIPIENT_REMOVE_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { ALLOWLIST_ROW_CLASSES } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSection'
import { cn } from '@safe-global/views/utils/cn'
import AddressInput from '@/components/common/AddressInput'
import Identicon from '@/components/common/Identicon'

type DraftFields = { name: string; address: string }

const INLINE_ADDRESS_INPUT = [
  '[&_[data-slot=field]]:w-full [&_[data-slot=field]]:gap-0.5',
  '[&_[data-slot=field-label]]:sr-only [&:has([aria-invalid=true])_[data-slot=field-label]]:not-sr-only',
  '[&_[data-slot=field]>div]:min-h-0 [&_[data-slot=field]>div]:gap-2 [&_[data-slot=field]>div]:border-0',
  '[&_[data-slot=field]>div]:bg-transparent [&_[data-slot=field]>div]:p-0 [&_[data-slot=field]>div]:shadow-none',
  '[&_[data-slot=field]>div>div:first-child]:hidden',
  '[&_input]:font-mono [&_input]:text-xs [&_input]:text-muted-foreground',
  // A saved contact swaps the input for a read-only chip, hidden above: keep the typed address showing instead.
  '[&_input]:visible! [&_input]:w-auto! [&_input]:flex-1!',
].join(' ')

type RecipientDraftRowProps = {
  safeAddress: string
  existing: readonly AllowlistRecipient[]
  onAdd: (recipient: AllowlistRecipient) => void
  onCancel: () => void
}

const RecipientDraftRow = ({ safeAddress, existing, onAdd, onCancel }: RecipientDraftRowProps): ReactElement => {
  const methods = useForm<DraftFields>({ mode: 'onChange', defaultValues: { name: '', address: '' } })
  const [step, setStep] = useState<'name' | 'address'>('name')
  const address = methods.watch('address')
  const name = methods.watch('name').trim()
  const { isValid, isValidating } = methods.formState
  const isAddressValid = step === 'address' && Boolean(address) && isValid && !isValidating

  const submitAddress = methods.handleSubmit(({ address: value }) => {
    onAdd({ name: name || undefined, address: checksumAddress(value), selected: true })
  })

  const handleSubmit = (event: FormEvent) => {
    if (step === 'address') return submitAddress(event)
    event.preventDefault()
    setStep('address')
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    onCancel()
  }

  return (
    <div className={cn(ALLOWLIST_ROW_CLASSES, 'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring')}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex items-center gap-2">
          {isAddressValid ? (
            <Identicon address={address} size={IDENTICON_SIZE} />
          ) : (
            <span className="size-6 shrink-0 rounded-full bg-muted" aria-hidden />
          )}

          {step === 'name' ? (
            <Input
              // eslint-disable-next-line no-restricted-syntax -- borderless inline name field inside a row; no Input variant renders it bare
              className="min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder={RECIPIENT_NAME_LABEL}
              aria-label={RECIPIENT_NAME_LABEL}
              {...methods.register('name')}
            />
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <Typography variant="paragraph-small-medium" className="truncate">
                {name || RECIPIENT_FALLBACK_NAME}
              </Typography>
              <div className={`min-w-0 ${INLINE_ADDRESS_INPUT}`}>
                <AddressInput
                  name="address"
                  label={RECIPIENT_ADDRESS_LABEL}
                  placeholder={RECIPIENT_ADDRESS_LABEL}
                  showPrefix={false}
                  focused
                  validate={(value: string) => validateAllowlistRecipient(value, { safeAddress, existing })}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label={step === 'name' ? RECIPIENT_NEXT_LABEL : RECIPIENT_ADD_CONFIRM_LABEL}
            disabled={step === 'address' && !isAddressValid}
          >
            <Check />
          </Button>
          <Button
            type="button"
            variant="ghost-muted"
            size="icon"
            aria-label={RECIPIENT_REMOVE_LABEL}
            onClick={onCancel}
          >
            <X />
          </Button>
        </form>
      </FormProvider>
    </div>
  )
}

export default RecipientDraftRow
