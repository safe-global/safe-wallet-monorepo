import type { ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'

export type BadgeToken = { address: string; symbol: string; logoUri?: string | null }

const AVATAR_SIZE = 18

/**
 * The token a policy is scoped to — the quickest way to tell sibling rows apart when
 * they all belong to the same policy type.
 */
export const TokenBadge = ({ token }: { token: BadgeToken }): ReactElement => (
  <Stack direction="row" alignItems="center" gap={0.625} sx={{ minWidth: 0 }}>
    {token.logoUri ? (
      <Box
        component="img"
        src={token.logoUri}
        alt=""
        sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', flexShrink: 0 }}
      />
    ) : (
      <Box
        aria-hidden
        sx={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: '50%',
          backgroundColor: 'background.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          color: 'text.secondary',
          flexShrink: 0,
        }}
      >
        {/* An initial, not the symbol — the symbol is already spelled out next to it. */}
        {(token.symbol || '?').slice(0, 1).toUpperCase()}
      </Box>
    )}
    <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>
      {token.symbol || 'Token'}
    </Typography>
  </Stack>
)

export default TokenBadge
