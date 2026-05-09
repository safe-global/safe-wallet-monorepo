import { Box, FormControl, InputLabel, MenuItem, Select, Typography, type SelectChangeEvent } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'

import css from './styles.module.css'

export type SignerSelectorProps = {
  options: string[]
  value: string | undefined
  onChange: (address: string) => void
  label?: string
  isOptionDisabled?: (address: string) => boolean
  disabledReason?: (address: string) => string
}

const SignerSelector = ({ options, value, onChange, label, isOptionDisabled, disabledReason }: SignerSelectorProps) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value)
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <FormControl fullWidth size="medium">
        <InputLabel id="signer-label">{label ?? 'Signer account'}</InputLabel>
        <Select
          className={css.signerForm}
          labelId="signer-label"
          label={label ?? 'Signer account'}
          fullWidth
          onChange={handleChange}
          value={value ?? ''}
        >
          {options.map((owner) => {
            const disabled = isOptionDisabled?.(owner) ?? false
            return (
              <MenuItem key={owner} value={owner} disabled={disabled}>
                <EthHashInfo address={owner} avatarSize={32} onlyName copyAddress={false} />
                {disabled && disabledReason && (
                  <Typography variant="caption" component="span" className={css.disabledPill}>
                    {disabledReason(owner)}
                  </Typography>
                )}
              </MenuItem>
            )
          })}
        </Select>
      </FormControl>
    </Box>
  )
}

export default SignerSelector
