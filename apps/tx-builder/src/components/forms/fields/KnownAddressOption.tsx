import { HTMLAttributes, ReactElement } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { createFilterOptions } from '@mui/material/Autocomplete'

import Identicon from '../../buttons/Identicon'
import { KnownAddress } from '../../../hooks/useKnownAddresses'

export const filterKnownAddresses = createFilterOptions<KnownAddress>({
  stringify: (option) => `${option.name} ${option.address}`,
})

type KnownAddressOptionProps = {
  liProps: HTMLAttributes<HTMLLIElement>
  option: KnownAddress
  networkPrefix?: string
}

const KnownAddressOption = ({ liProps, option, networkPrefix }: KnownAddressOptionProps): ReactElement => {
  return (
    <Box component="li" {...liProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Identicon address={option.address} size="lg" />

      <Box sx={{ minWidth: 0 }}>
        {option.name && (
          <Typography variant="body2" fontWeight={600} noWrap>
            {option.name}
          </Typography>
        )}

        <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {networkPrefix ? <b>{networkPrefix}:</b> : null}
          {option.address.slice(0, 2)}
          <b>{option.address.slice(2, 6)}</b>
          {option.address.slice(6, -4)}
          <b>{option.address.slice(-4)}</b>
        </Typography>
      </Box>
    </Box>
  )
}

export default KnownAddressOption
