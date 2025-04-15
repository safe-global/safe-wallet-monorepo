import { useCallback, type ReactElement } from 'react'
import { Checkbox, Autocomplete, TextField, Chip, Box, Typography } from '@mui/material'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import ChainIndicator from '../ChainIndicator'
import css from './styles.module.css'
import { useFormContext } from 'react-hook-form'
import useChains from '@/hooks/useChains'

type NetworkMultiSelectorInputProps = {
  value: ChainInfo[]
  name: string
  onNetworkChange?: (networks: ChainInfo[]) => void
  isOptionDisabled?: (network: ChainInfo) => boolean
  error?: boolean
  helperText?: string
  showSelectAll?: boolean
}

const SELECT_ALL_OPTION = { chainId: 'select-all', chainName: 'Select All' } as ChainInfo

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

  const getOptionDisabled = isOptionDisabled || (() => false)

  const handleChange = useCallback(
    (newNetworks: ChainInfo[]) => {
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

  const isAllSelected = value.length === configs.length

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      handleChange([])
    } else {
      handleChange(configs)
    }
  }, [isAllSelected, handleChange, configs])

  const options = showSelectAll ? [SELECT_ALL_OPTION, ...configs] : configs

  const renderTags = useCallback(
    (selectedOptions: (ChainInfo | typeof SELECT_ALL_OPTION)[]) => {
      if (showSelectAll && isAllSelected) {
        return (
          <Typography variant="body2">
            All networks{' '}
            <Box component="span" sx={{ color: 'text.secondary' }}>
              (Default)
            </Box>
          </Typography>
        )
      }

      return selectedOptions.map((chain) => (
        <Chip
          variant="outlined"
          key={chain.chainId}
          avatar={<ChainIndicator chainId={chain.chainId} onlyLogo inline />}
          label={chain.chainName}
          onDelete={() => handleDelete(chain.chainId)}
          className={css.multiChainChip}
        />
      ))
    },
    [showSelectAll, isAllSelected, handleDelete],
  )

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<HTMLLIElement> & { key: string },
      chain: ChainInfo | typeof SELECT_ALL_OPTION,
      { selected }: { selected: boolean },
    ) => {
      const { key, ...rest } = props

      if (showSelectAll && chain.chainId === SELECT_ALL_OPTION.chainId) {
        return (
          <Box component="li" key={key} {...rest} onClick={toggleSelectAll}>
            <Checkbox data-testid="select-all-checkbox" size="small" checked={isAllSelected} />
            <span>Select All</span>
          </Box>
        )
      }

      return (
        <Box component="li" key={key} {...rest}>
          <Checkbox data-testid="network-checkbox" size="small" checked={selected} />
          <ChainIndicator chainId={chain.chainId} inline />
        </Box>
      )
    },
    [showSelectAll, isAllSelected, toggleSelectAll],
  )

  return (
    <Autocomplete
      multiple
      value={value || []}
      disableCloseOnSelect
      options={options}
      renderTags={renderTags}
      renderOption={renderOption}
      getOptionLabel={(option) => option.chainName}
      getOptionDisabled={(option) =>
        showSelectAll && option.chainId === SELECT_ALL_OPTION.chainId ? false : getOptionDisabled(option)
      }
      renderInput={(params) => <TextField {...params} error={error} helperText={helperText} />}
      filterOptions={(options, { inputValue }) => {
        if (!inputValue) return options
        return options.filter(
          (option) =>
            (showSelectAll && option.chainId === SELECT_ALL_OPTION.chainId) ||
            option.chainName.toLowerCase().includes(inputValue.toLowerCase()),
        )
      }}
      isOptionEqualToValue={(option, value) => option.chainId === value.chainId}
      onChange={(_, data) => handleChange(data)}
    />
  )
}

export default NetworkMultiSelectorInput
