import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { XIcon } from 'lucide-react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ChainIndicator from '../ChainIndicator'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const getOptionDisabled = isOptionDisabled || (() => false)

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
  }

  return (
    <div ref={wrapperRef} className={css.multiSelectWrapper}>
      <div
        className={`${css.multiSelectControl} ${error ? css.multiSelectError : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {renderChips()}

        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${name}-listbox`}
          aria-invalid={error || undefined}
          className={css.multiSelectInput}
          placeholder={value.length === 0 ? 'Select networks' : undefined}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          onClick={() => setOpen((prev) => !prev)}
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
      </div>

      {open && (
        <ul id={`${name}-listbox`} role="listbox" aria-multiselectable className={css.multiSelectList}>
          {visibleOptions.map((chain) => {
            const disabled =
              showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId ? false : getOptionDisabled(chain as Chain)
            const selected =
              showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId ? isAllSelected : isSelected(chain.chainId)

            return (
              <li
                key={chain.chainId}
                role="option"
                aria-disabled={Boolean(disabled)}
                aria-selected={Boolean(selected)}
                className={css.multiSelectOption}
                onClick={() => handleOptionClick(chain, disabled)}
              >
                {renderOptionContent(chain)}
              </li>
            )
          })}
        </ul>
      )}

      {helperText && (
        <Typography variant="paragraph-mini" className={error ? 'text-destructive' : 'text-muted-foreground'}>
          {helperText}
        </Typography>
      )}
    </div>
  )
}

export default NetworkMultiSelectorInput
