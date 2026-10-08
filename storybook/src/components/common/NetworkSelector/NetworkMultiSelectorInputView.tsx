import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactElement, ReactNode, RefObject } from 'react'
import { XIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { InputGroup } from '@/components/ui/input-group'
import css from './styles.module.css'

export type ChainIndicatorSlotProps = {
  chainId: string
  inline?: boolean
  onlyLogo?: boolean
  responsive?: boolean
}

export type NetworkMultiSelectorOption = {
  chainId: string
  id: string
  isSelectAll: boolean
  disabled: boolean
  selected: boolean
}

export type NetworkMultiSelectorInputViewProps = {
  name: string
  chips: { chainId: string; chainName: string }[]
  showAllSelected: boolean
  isAllSelected: boolean
  hasValue: boolean
  options: NetworkMultiSelectorOption[]
  activeIndex: number
  activeOptionId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  inputRef: RefObject<HTMLInputElement | null>
  inputValue: string
  error?: boolean
  helperText?: string
  onFieldClick: () => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onChipDelete: (e: MouseEvent, chainId: string) => void
  onClearAll: (e: MouseEvent) => void
  onOptionClick: (index: number) => void
  onOptionHover: (index: number) => void
  /** Renders the ChainIndicator container */
  renderChainIndicator: (props: ChainIndicatorSlotProps) => ReactNode
}

export function NetworkMultiSelectorInputView({
  name,
  chips,
  showAllSelected,
  isAllSelected,
  hasValue,
  options,
  activeIndex,
  activeOptionId,
  open,
  onOpenChange,
  inputRef,
  inputValue,
  error,
  helperText,
  onFieldClick,
  onInputChange,
  onInputKeyDown,
  onChipDelete,
  onClearAll,
  onOptionClick,
  onOptionHover,
  renderChainIndicator,
}: NetworkMultiSelectorInputViewProps): ReactElement {
  const renderChips = () => {
    if (showAllSelected) {
      return (
        <Typography variant="paragraph-small">
          All networks <span className="text-muted-foreground">(Default)</span>
        </Typography>
      )
    }

    return chips.map((chain) => (
      <span key={chain.chainId} className={css.multiChainChip}>
        {renderChainIndicator({ chainId: chain.chainId, onlyLogo: true, inline: true })}
        <span>{chain.chainName}</span>
        <button
          type="button"
          aria-label={`Remove ${chain.chainName}`}
          className={css.chipDelete}
          onClick={(e) => onChipDelete(e, chain.chainId)}
        >
          <XIcon data-testid="CancelIcon" className="size-3.5" />
        </button>
      </span>
    ))
  }

  const renderOptionContent = (option: NetworkMultiSelectorOption) => {
    if (option.isSelectAll) {
      return (
        <>
          <Checkbox data-testid="select-all-checkbox" checked={isAllSelected} className="pointer-events-none" />
          <span>Select All</span>
        </>
      )
    }

    return (
      <>
        <Checkbox data-testid="network-checkbox" checked={option.selected} className="pointer-events-none" />
        {renderChainIndicator({ chainId: option.chainId, inline: true })}
      </>
    )
  }

  return (
    <div className={css.multiSelectWrapper}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger render={<InputGroup inputSize="heroWrap" className="cursor-text" onClick={onFieldClick} />}>
          {renderChips()}

          <input
            ref={inputRef}
            /* Lets InputGroup apply its focus ring and aria-invalid border to this input. */
            data-slot="input-group-control"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${name}-listbox`}
            aria-invalid={error || undefined}
            aria-activedescendant={activeOptionId}
            className={css.multiSelectInput}
            placeholder={hasValue ? undefined : 'Select networks'}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
          />

          {hasValue && (
            <button type="button" aria-label="Clear all" className={css.clearAll} onClick={onClearAll}>
              <XIcon data-testid="CloseIcon" className="size-4" />
            </button>
          )}
        </PopoverTrigger>

        {/* Portaled by PopoverContent so it escapes the dialog's overflow clipping. */}
        <PopoverContent
          align="start"
          sideOffset={4}
          initialFocus={inputRef}
          className="max-h-[300px] w-[var(--anchor-width)] overflow-y-auto p-1"
        >
          <ul id={`${name}-listbox`} role="listbox" aria-multiselectable className="m-0 list-none p-0">
            {options.map((option, index) => (
              <li
                key={option.chainId}
                id={option.id}
                role="option"
                aria-disabled={Boolean(option.disabled)}
                aria-selected={Boolean(option.selected)}
                data-active={index === activeIndex || undefined}
                className={css.multiSelectOption}
                onClick={() => onOptionClick(index)}
                onMouseEnter={() => onOptionHover(index)}
              >
                {renderOptionContent(option)}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      {helperText && (
        <Typography variant="paragraph-mini" className={error ? 'text-destructive' : 'text-muted-foreground'}>
          {helperText}
        </Typography>
      )}
    </div>
  )
}
