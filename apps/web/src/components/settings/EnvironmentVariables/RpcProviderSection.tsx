import { Controller, useFormContext } from 'react-hook-form'
import { TextField, Typography, InputAdornment, Tooltip, IconButton, SvgIcon } from '@mui/material'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import { useCurrentChain } from '@/hooks/useChains'
import InfoIcon from '@/public/images/notifications/info.svg'
import { EnvVariablesField } from './index'

type RpcProviderSectionProps = {
  onReset: () => void
  showResetButton: boolean
}

const RpcProviderSection = ({ onReset, showResetButton }: RpcProviderSectionProps) => {
  const chain = useCurrentChain()
  const { control } = useFormContext()

  return (
    <>
      <Typography
        sx={{
          fontWeight: 700,
          mb: 2,
          mt: 3,
        }}
      >
        RPC provider
        <Tooltip placement="top" arrow title="Any provider that implements the Ethereum JSON-RPC standard can be used.">
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              fontSize="small"
              color="border"
              sx={{ verticalAlign: 'middle', ml: 0.5 }}
            />
          </span>
        </Tooltip>
      </Typography>

      <Controller
        name={EnvVariablesField.rpc}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value || ''}
            variant="outlined"
            type="url"
            placeholder={chain?.rpcUri.value}
            InputProps={{
              endAdornment: showResetButton ? (
                <InputAdornment position="end">
                  <Tooltip title="Reset to default value">
                    <IconButton onClick={onReset} size="small" color="primary">
                      <RotateLeftIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : null,
            }}
            fullWidth
          />
        )}
      />
    </>
  )
}

export default RpcProviderSection
