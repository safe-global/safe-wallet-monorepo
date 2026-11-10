import { useState } from 'react'
import { Box } from '@mui/material'

const FALLBACK_ICON = './question.svg'

function TokenIcon({ logoUri, symbol }: { logoUri: string; symbol: string }) {
  const [src, setSrc] = useState(logoUri || FALLBACK_ICON)

  return (
    <Box
      component="img"
      src={src}
      alt={symbol}
      onError={() => setSrc(FALLBACK_ICON)}
      sx={{ height: '1.5em', width: 'auto', mr: 1.25 }}
    />
  )
}

export default TokenIcon
