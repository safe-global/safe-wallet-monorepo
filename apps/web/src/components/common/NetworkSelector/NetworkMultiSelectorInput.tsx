import { useCallback, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { XIcon } from 'lucide-react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ChainIndicator from '../ChainIndicator'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import css from './styles.module.css'
import { useFormContext } from 'react-hook-form'
import useChains from '@/hooks/useChains'

type NetworkMultiSelectorInputProps = {
  value: Chain[]
  name: string
  onNetworkChange?: (networks: Chain[]) => void
  isOptionDisabled?: (network: Chain) => boolean
  error?: boolean
  helperText?: string
  showSelectAll?: boolean
}

const SELECT_ALL_OPTION = { chainId: 'select-all', chainName: 'Select All' } as Chain

const NetworkMultiSelectorInput = ({
  value,
  name,
  onNetworkChange,
  isOptionDisabled,
  error,
  helperText,
  showSelectAll = false,
}: NetworkMultiSelectorInputProps): ReactElement => {
  const { configs } = useChains()
  const { setValue } = useFormContext()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const getOptionDisabled = isOptionDisabled || (() => false)

  const isSelectAllOption = (chain: Chain) => showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId

  const isOptionDisabledState = (chain: Chain) => (isSelectAllOption(chain) ? false : getOptionDisabled(chain))

  const getOptionId = (chain: Chain) => `${name}-option-${chain.chainId}`

  const handleChange = useCallback(
    (newNetworks: Chain[]) => {
      const filteredData = showSelectAll
        ? newNetworks.filter((item) => item.chainId !== SELECT_ALL_OPTION.chainId)
        : newNetworks

      setValue(name, filteredData, { shouldValidate: true })
      if (onNetworkChange) {
        onNetworkChange(filteredData)
      }
    },
    [name, setValue, onNetworkChange, showSelectAll],
  )

  const handleDelete = useCallback(
    (deletedChainId: string) => {
      const updatedValues = value.filter((chain) => chain.chainId !== deletedChainId)
      handleChange(updatedValues)
    },
    [handleChange, value],
  )

  const isSelected = useCallback((chainId: string) => value.some((chain) => chain.chainId === chainId), [value])

  const isAllSelected = value.length === configs.length

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      handleChange([])
    } else {
      handleChange(configs)
    }
  }, [isAllSelected, handleChange, configs])

  const toggleOption = useCallback(
    (chain: Chain) => {
      if (isSelected(chain.chainId)) {
        handleChange(value.filter((item) => item.chainId !== chain.chainId))
      } else {
        handleChange([...value, chain])
      }
    },
    [handleChange, isSelected, value],
  )

  const options = showSelectAll ? [SELECT_ALL_OPTION, ...configs] : configs

  const visibleOptions = inputValue
    ? options.filter(
        (option) =>
          (showSelectAll && option.chainId === SELECT_ALL_OPTION.chainId) ||
          option.chainName.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : options

  const renderChips = () => {
    if (showSelectAll && isAllSelected) {
      return (
        <Typography variant="paragraph-small">
          All networks <span className="text-muted-foreground">(Default)</span>
        </Typography>
      )
    }

    return value.map((chain) => (
      <span key={chain.chainId} className={css.multiChainChip}>
        <ChainIndicator chainId={chain.chainId} onlyLogo inline />
        <span>{chain.chainName}</span>
        <button
          type="button"
          aria-label={`Remove ${chain.chainName}`}
          className={css.chipDelete}
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(chain.chainId)
          }}
        >
          <XIcon data-testid="CancelIcon" className="size-3.5" />
        </button>
      </span>
    ))
  }

  const renderOptionContent = (chain: Chain | typeof SELECT_ALL_OPTION) => {
    if (showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId) {
      return (
        <>
          <Checkbox data-testid="select-all-checkbox" checked={isAllSelected} className="pointer-events-none" />
          <span>Select All</span>
        </>
      )
    }

    return (
      <>
        <Checkbox data-testid="network-checkbox" checked={isSelected(chain.chainId)} className="pointer-events-none" />
        <ChainIndicator chainId={chain.chainId} inline />
      </>
    )
  }

  const handleOptionClick = (chain: Chain | typeof SELECT_ALL_OPTION, disabled: boolean) => {
    if (disabled) return
    if (showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId) {
      toggleSelectAll()
    } else {
      toggleOption(chain as Chain)
    }
    // Selecting an option resets the search text (MUI Autocomplete parity) so the next
    // search starts fresh instead of appending to a stale filter.
    setInputValue('')
    setActiveIndex(-1)
  }

  // The pinned Select All row stays visible (and clickable) while filtering, but arrow keys
  // skip it — otherwise "type a filter, ↓, Enter" would select every network instead of the match.
  const isKeyboardSkippable = (option: Chain) => Boolean(inputValue) && isSelectAllOption(option)

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const wasOpen = open
      if (!wasOpen) setOpen(true)
      const count = visibleOptions.length
      if (count === 0) return
      const delta = event.key === 'ArrowDown' ? 1 : -1
      let next = !wasOpen || activeIndex === -1 ? (delta === 1 ? 0 : count - 1) : (activeIndex + delta + count) % count
      let steps = 0
      while (isKeyboardSkippable(visibleOptions[next] as Chain) && steps < count) {
        next = (next + delta + count) % count
        steps++
      }
      if (isKeyboardSkippable(visibleOptions[next] as Chain)) return
      setActiveIndex(next)
      document.getElementById(getOptionId(visibleOptions[next] as Chain))?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      // While the popup is open, Enter should not submit the surrounding form — it picks the highlighted option or does nothing.
      if (open) {
        event.preventDefault()
        if (activeIndex >= 0 && activeIndex < visibleOptions.length) {
          const chain = visibleOptions[activeIndex] as Chain
          handleOptionClick(chain, isOptionDisabledState(chain))
        }
      }
    } else if (event.key === 'Escape') {
      if (open) setOpen(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setActiveIndex(-1)
  }

  const activeOption = open && activeIndex >= 0 ? (visibleOptions[activeIndex] as Chain | undefined) : undefined

  return (
    <div className={css.multiSelectWrapper}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <div
              className={`${css.multiSelectControl} ${error ? css.multiSelectError : ''}`}
              onClick={() => inputRef.current?.focus()}
            />
          }
        >
          {renderChips()}

          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${name}-listbox`}
            aria-invalid={error || undefined}
            aria-activedescendant={activeOption ? getOptionId(activeOption) : undefined}
            className={css.multiSelectInput}
            placeholder={value.length === 0 ? 'Select networks' : undefined}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setActiveIndex(-1)
              setOpen(true)
            }}
            onKeyDown={handleInputKeyDown}
          />

          {value.length > 0 && (
            <button
              type="button"
              aria-label="Clear all"
              className={css.clearAll}
              onClick={(e) => {
                e.stopPropagation()
                handleChange([])
              }}
            >
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
            {visibleOptions.map((chain, index) => {
              const disabled = isOptionDisabledState(chain as Chain)
              const selected = isSelectAllOption(chain as Chain) ? isAllSelected : isSelected(chain.chainId)

              return (
                <li
                  key={chain.chainId}
                  id={getOptionId(chain as Chain)}
                  role="option"
                  aria-disabled={Boolean(disabled)}
                  aria-selected={Boolean(selected)}
                  data-active={index === activeIndex || undefined}
                  className={css.multiSelectOption}
                  onClick={() => handleOptionClick(chain, disabled)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {renderOptionContent(chain)}
                </li>
              )
            })}
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

export default NetworkMultiSelectorInput
