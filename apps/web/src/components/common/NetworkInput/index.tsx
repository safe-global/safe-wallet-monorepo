import ChainIndicator from '@/components/common/ChainIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useTheme } from '@mui/material/styles'
import { FormControl, InputLabel, ListSubheader, MenuItem, Select, Typography } from '@mui/material'
import partition from 'lodash/partition'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import css from './styles.module.css'
import { type ReactElement, useCallback, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const NetworkInput = ({
  name,
  required = false,
  chainConfigs,
}: {
  name: string
  required?: boolean
  chainConfigs: (Chain & { available: boolean })[]
}): ReactElement => {
  const isDarkMode = useDarkMode()
  const theme = useTheme()
  const [testNets, prodNets] = useMemo(() => partition(chainConfigs, (config) => config.isTestnet), [chainConfigs])
  const { control } = useFormContext() || {}

  const renderMenuItem = useCallback(
    (chainId: string, isDisabled: boolean) => {
      const chain = chainConfigs.find((chain) => chain.chainId === chainId)
      if (!chain) return null
      return (
        <MenuItem
          disabled={isDisabled}
          key={chainId}
          value={chainId}
          sx={{ '&:hover': { backgroundColor: 'inherit' } }}
        >
          <ChainIndicator chainId={chain.chainId} />
          {isDisabled && (
            <Typography variant="caption" component="span" className={css.disabledChip}>
              Not available
            </Typography>
          )}
        </MenuItem>
      )
    },
    [chainConfigs],
  )

  return (
    <Controller
      name={name}
      rules={{ required }}
      control={control}
      // eslint-disable-next-line
      render={({ field: { ref, ...field } }) => (
        <FormControl fullWidth>
          <InputLabel id="network-input-label">Network</InputLabel>
          <Select
            {...field}
            labelId="network-input-label"
            id="network-input"
            fullWidth
            label="Network"
            IconComponent={ExpandMoreIcon}
            renderValue={(value) => renderMenuItem(value, false)}
            MenuProps={{
              sx: {
                '& .MuiPaper-root': {
                  overflow: 'auto',
                },
                ...(isDarkMode
                  ? {
                      '& .Mui-selected, & .Mui-selected:hover': {
                        backgroundColor: `${theme.palette.secondary.background} !important`,
                      },
                    }
                  : {}),
              },
            }}
          >
            {prodNets.map((chain) => renderMenuItem(chain.chainId, !chain.available))}

            {testNets.length > 0 && <ListSubheader className={css.listSubHeader}>Testnets</ListSubheader>}

            {testNets.map((chain) => renderMenuItem(chain.chainId, !chain.available))}
          </Select>
        </FormControl>
      )}
    />
  )
}

export default NetworkInput
