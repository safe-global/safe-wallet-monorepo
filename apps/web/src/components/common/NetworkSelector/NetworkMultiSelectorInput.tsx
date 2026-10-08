import { useCallback, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import ChainIndicator from '../ChainIndicator'
import { NetworkMultiSelectorInputView } from '@views/components/common/NetworkSelector/NetworkMultiSelectorInputView'
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
    <NetworkMultiSelectorInputView
      name={name}
      chips={value.map((chain) => ({ chainId: chain.chainId, chainName: chain.chainName }))}
      showAllSelected={showSelectAll && isAllSelected}
      isAllSelected={isAllSelected}
      hasValue={value.length > 0}
      options={visibleOptions.map((chain) => ({
        chainId: chain.chainId,
        id: getOptionId(chain as Chain),
        isSelectAll: isSelectAllOption(chain as Chain),
        disabled: isOptionDisabledState(chain as Chain),
        selected: isSelectAllOption(chain as Chain) ? isAllSelected : isSelected(chain.chainId),
      }))}
      activeIndex={activeIndex}
      activeOptionId={activeOption ? getOptionId(activeOption) : undefined}
      open={open}
      onOpenChange={handleOpenChange}
      inputRef={inputRef}
      inputValue={inputValue}
      error={error}
      helperText={helperText}
      onFieldClick={() => inputRef.current?.focus()}
      onInputChange={(e) => {
        setInputValue(e.target.value)
        setActiveIndex(-1)
        setOpen(true)
      }}
      onInputKeyDown={handleInputKeyDown}
      onChipDelete={(e, chainId) => {
        e.stopPropagation()
        handleDelete(chainId)
      }}
      onClearAll={(e) => {
        e.stopPropagation()
        handleChange([])
      }}
      onOptionClick={(index) => {
        const chain = visibleOptions[index]
        handleOptionClick(chain, isOptionDisabledState(chain as Chain))
      }}
      onOptionHover={setActiveIndex}
      renderChainIndicator={(props) => <ChainIndicator {...props} />}
    />
  )
}

export default NetworkMultiSelectorInput
