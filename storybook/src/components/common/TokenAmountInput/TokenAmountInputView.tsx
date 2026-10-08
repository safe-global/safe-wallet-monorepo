import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import classNames from 'classnames'
import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

export type AmountFieldSlotProps = {
  'data-testid': string
  label: string
  error: boolean
  fullWidth: boolean
  inputSize: 'hero'
  endAdornment: ReactNode
  required: boolean
  placeholder: string
}

export type TokenAmountInputViewProps = {
  amountErrorMessage?: string
  isAmountError: boolean
  showMax: boolean
  onMaxClick: () => void
  tokenAddressField: string
  tokenAddress: string
  onTokenChange: (value: string | null) => void
  /** The selected token's row, rendered by the AutocompleteItem container */
  selectedToken?: ReactNode
  tokens: { address: string; item: ReactNode }[]
  /** Renders the NumberField container, registered with the form */
  renderAmountField: (props: AmountFieldSlotProps) => ReactNode
  /** The FiatValue container, when there is a fiat value */
  fiatValue?: ReactNode
}

export function TokenAmountInputView({
  amountErrorMessage,
  isAmountError,
  showMax,
  onMaxClick,
  tokenAddressField,
  tokenAddress,
  onTokenChange,
  selectedToken,
  tokens,
  renderAmountField,
  fiatValue,
}: TokenAmountInputViewProps): ReactElement {
  return (
    <>
      <div data-testid="token-amount-section" className="w-full">
        {renderAmountField({
          'data-testid': 'token-amount-field',
          label: amountErrorMessage || 'Amount',
          error: isAmountError,
          fullWidth: true,
          inputSize: 'hero',
          endAdornment: (
            <div className="flex items-stretch gap-1">
              {showMax && (
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="max-btn"
                  // eslint-disable-next-line no-restricted-syntax -- h-auto drops size="sm"'s h-8 so Max matches the content-sized token select beside it
                  className="h-auto uppercase"
                  onClick={onMaxClick}
                >
                  Max
                </Button>
              )}
              <Separator orientation="vertical" className="mx-1" />
              <div data-testid="token-selector" className={css.select}>
                <Select name={tokenAddressField} value={tokenAddress} onValueChange={onTokenChange} required>
                  {/* size="sm" lines the trigger up with the Max button and the h-8 divider beside it;
                      min-h still lets it grow for the rich token row. */}
                  <SelectTrigger size="sm">
                    {/* Always pass a non-null child: with no child, base-ui's SelectValue falls back to
                        rendering the raw address (e.g. in a new Safe with no funds). */}
                    <SelectValue>{selectedToken ? selectedToken : ''}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-44 max-w-[var(--available-width)]">
                    {tokens.map(({ address, item }) => (
                      <SelectItem data-testid="token-item" key={address} value={address}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
          required: true,
          placeholder: '0',
        })}
      </div>
      {fiatValue != null && (
        <Typography
          data-testid="fiat-display"
          variant="paragraph-mini"
          className={classNames(css.fiatDisplay, 'text-muted-foreground')}
        >
          {fiatValue}
        </Typography>
      )}
    </>
  )
}
