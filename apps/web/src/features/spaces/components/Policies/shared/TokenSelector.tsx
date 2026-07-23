import { Paper, Stack, Typography } from '@mui/material'
import type { TokenInfo } from '@safe-global/store/gateway/policies/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { SelectionCheck } from '../wizardCommon'

type TokenSelectorProps = {
  tokens: TokenInfo[]
  selected: TokenInfo[]
  onChange: (tokens: TokenInfo[]) => void
}

export const TokenSelector = ({ tokens, selected, onChange }: TokenSelectorProps) => {
  const isSelected = (token: TokenInfo) => selected.some((s) => sameAddress(s.address, token.address))

  const toggle = (token: TokenInfo) => {
    onChange(isSelected(token) ? selected.filter((s) => !sameAddress(s.address, token.address)) : [...selected, token])
  }

  return (
    <Stack gap={1}>
      {tokens.map((token) => (
        <Paper
          key={token.address}
          elevation={0}
          role="button"
          aria-pressed={isSelected(token)}
          onClick={() => toggle(token)}
          sx={{
            p: 1.5,
            borderRadius: '12px',
            border: '1.5px solid',
            borderColor: isSelected(token) ? 'secondary.main' : 'border.light',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <SelectionCheck selected={isSelected(token)} />
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{token.symbol}</Typography>
        </Paper>
      ))}
    </Stack>
  )
}
