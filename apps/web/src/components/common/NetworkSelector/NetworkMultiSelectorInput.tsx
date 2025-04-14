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

const SELECT_ALL_OPTION = { chainId: 'select-all', chainName: 'Select All' }

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
      setValue(name, newNetworks, { shouldValidate: true })
      if (onNetworkChange) {
        onNetworkChange(newNetworks)
      }
    },
    [name, setValue, onNetworkChange],
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

  const handleDeleteAll = useCallback(() => {
    handleChange([])
  }, [handleChange])

  const options = showSelectAll ? [SELECT_ALL_OPTION, ...configs] : configs

  return (
    <Autocomplete
      multiple
      value={value || []}
      disableCloseOnSelect
      options={options}
      renderTags={(selectedOptions) => {
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
      }}
      renderOption={(props, chain, { selected }) => {
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
      }}
      getOptionLabel={(option) => option.chainName}
      getOptionDisabled={(option) =>
        showSelectAll && option.chainId === SELECT_ALL_OPTION.chainId ? false : getOptionDisabled(option as ChainInfo)
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
      onChange={(_, data) => {
        const filteredData = showSelectAll
          ? (data.filter((item) => item.chainId !== SELECT_ALL_OPTION.chainId) as ChainInfo[])
          : (data as ChainInfo[])
        handleChange(filteredData)
      }}
    />
  )
}

export default NetworkMultiSelectorInput
