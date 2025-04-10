import { useCallback, type ReactElement } from 'react'
import { Checkbox, Autocomplete, TextField, Chip, Box } from '@mui/material'
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
}

const NetworkMultiSelectorInput = ({
  value,
  name,
  onNetworkChange,
  isOptionDisabled,
  error,
  helperText,
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

  return (
    <Autocomplete
      multiple
      value={value || []}
      disableCloseOnSelect
      options={configs}
      renderTags={(selectedOptions) =>
        selectedOptions.map((chain) => (
          <Chip
            variant="outlined"
            key={chain.chainId}
            avatar={<ChainIndicator chainId={chain.chainId} onlyLogo inline />}
            label={chain.chainName}
            onDelete={() => handleDelete(chain.chainId)}
            className={css.multiChainChip}
          />
        ))
      }
      renderOption={(props, chain, { selected }) => {
        const { key, ...rest } = props

        return (
          <Box component="li" key={key} {...rest}>
            <Checkbox data-testid="network-checkbox" size="small" checked={selected} />
            <ChainIndicator chainId={chain.chainId} inline />
          </Box>
        )
      }}
      getOptionLabel={(option) => option.chainName}
      getOptionDisabled={getOptionDisabled}
      renderInput={(params) => <TextField {...params} error={error} helperText={helperText} />}
      filterOptions={(options, { inputValue }) =>
        options.filter((option) => option.chainName.toLowerCase().includes(inputValue.toLowerCase()))
      }
      isOptionEqualToValue={(option, value) => option.chainId === value.chainId}
      onChange={(_, data) => handleChange(data)}
    />
  )
}

export default NetworkMultiSelectorInput
