import { type CSSProperties, type ReactElement, type ReactNode, type Ref } from 'react'
import { RotateCcw } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import css from './styles.module.css'
import classNames from 'classnames'

export type NonceFormOptionViewProps = {
  nonce: string
  tx?: { note?: string; humanDescription?: string | null; typeText: string }
}

export const NonceFormOptionView = ({ nonce, tx }: NonceFormOptionViewProps): ReactElement => {
  const txLabel = tx ? tx.note || tx.humanDescription || `${tx.typeText} transaction` : undefined
  const label = txLabel || 'New transaction'

  return (
    <Typography variant="paragraph-small">
      <b>{nonce}</b>&nbsp;- {label}
    </Typography>
  )
}

const getFieldMinWidth = (value: string): string => {
  const MIN_CHARS = 5
  const MAX_WIDTH = '200px'
  const clamped = `clamp(calc(${MIN_CHARS}ch + 6px), calc(${Math.max(MIN_CHARS, value.length)}ch + 6px), ${MAX_WIDTH})`
  return clamped
}

export const TxNonceReadOnlyView = ({ nonce }: { nonce: string }): ReactElement => (
  <Typography variant="paragraph-small-bold" className="-ml-2">
    {nonce}
  </Typography>
)

export type TxNonceFormViewProps = {
  name: string
  value: string
  inputRef: Ref<HTMLInputElement>
  onValueChange: (value: string) => void
  onBlur: () => void
  message?: string
  recommendedNonce: string
  previousNonces: string[]
  showRecommendedNonceButton: boolean
  onReset: () => void
  renderOption: (option: string) => ReactNode
}

export const TxNonceFormView = ({
  name,
  value,
  inputRef,
  onValueChange,
  onBlur,
  message,
  recommendedNonce,
  previousNonces,
  showRecommendedNonceButton,
  onReset,
  renderOption,
}: TxNonceFormViewProps): ReactElement => {
  const options = [recommendedNonce, ...previousNonces]

  return (
    <Combobox
      items={options}
      // `value` must be bound alongside `inputValue`: on close Base UI resets the input to the
      // selected value, so leaving selection uncontrolled discards a typed nonce.
      value={value}
      onValueChange={(value) => onValueChange(typeof value === 'string' ? value : '')}
      inputValue={value}
      onInputValueChange={(value) => onValueChange(value)}
      // Always surface the recommended/recent presets regardless of the typed value
      filter={() => true}
      inputRef={inputRef}
    >
      <Tooltip open={!!message}>
        <TooltipTrigger render={<div className="inline-flex" />}>
          <ComboboxInput
            name={name}
            aria-label={message || undefined}
            showTrigger
            // The clamp sizes the text input itself; the group grows to fit the trigger/reset addons
            className="[&_input]:font-bold [&_input]:w-(--nonce-width) [&_input]:min-w-0"
            style={{ '--nonce-width': getFieldMinWidth(value) } as CSSProperties}
            onBlur={onBlur}
          >
            {showRecommendedNonceButton && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Reset to recommended nonce"
                  onClick={(event) => {
                    event.stopPropagation()
                    onReset()
                  }}
                >
                  <RotateCcw className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </ComboboxInput>
        </TooltipTrigger>
        {message && <TooltipContent side="top">{message}</TooltipContent>}
      </Tooltip>

      {/* The input itself is tiny (clamped to a few characters), but the shared default ties
          the popup width to it via --anchor-width. Options show full labels like "12 - New
          transaction", so size the popup to that content instead — matching the pre-migration
          MUI Popper, which explicitly opted out of the anchor-width tie for this field. */}
      <ComboboxContent className="w-max min-w-40 max-w-[300px]">
        <ComboboxList>
          {/* Each label must live inside its own ComboboxGroup — Base UI's GroupLabel throws
              without a Group ancestor, which previously crashed the popup on open. */}
          <ComboboxGroup items={[recommendedNonce]}>
            <ComboboxLabel>Recommended nonce</ComboboxLabel>
            <ComboboxCollection>
              {(option: string) => (
                <ComboboxItem key={option} value={option}>
                  {renderOption(option)}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>

          {previousNonces.length > 0 && (
            <ComboboxGroup items={previousNonces}>
              <ComboboxLabel className="pt-3">Replace existing</ComboboxLabel>
              <ComboboxCollection>
                {(option: string) => (
                  <ComboboxItem key={option} value={option}>
                    {renderOption(option)}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

const skeletonMinWidth = getFieldMinWidth('')

export type TxNonceViewProps = {
  nonce?: number
  isLoading: boolean
  form?: ReactNode
}

export const TxNonceView = ({ nonce, isLoading, form }: TxNonceViewProps): ReactElement => {
  return (
    <div data-testid="nonce-fld" className={classNames('flex items-center gap-2', css.nonce)}>
      Nonce{' '}
      <Typography variant="paragraph-bold" className="inline">
        #
      </Typography>
      {isLoading ? (
        // h-9 matches the ComboboxInput/SelectTrigger it stands in for, so the row doesn't shift on load
        <Skeleton style={{ width: skeletonMinWidth }} className="h-9" />
      ) : form ? (
        form
      ) : (
        <Typography variant="paragraph-bold" className="-ml-2">
          {nonce}
        </Typography>
      )}
    </div>
  )
}
