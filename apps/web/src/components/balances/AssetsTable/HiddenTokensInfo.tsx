import { Typography } from '@mui/material'
import { useHiddenTokenCounts } from '@/hooks/useHiddenTokenCounts'

interface HiddenTokensInfoProps {
  onOpenManageTokens?: () => void
}

export const HiddenTokensInfo = ({ onOpenManageTokens }: HiddenTokensInfoProps) => {
  const { hiddenByTokenList, hiddenByDustFilter } = useHiddenTokenCounts()

  const parts: string[] = []

  if (hiddenByDustFilter > 0) {
    parts.push(`${hiddenByDustFilter} small balance${hiddenByDustFilter !== 1 ? 's' : ''}`)
  }

  if (hiddenByTokenList > 0) {
    parts.push(`${hiddenByTokenList} token${hiddenByTokenList !== 1 ? 's' : ''} hidden`)
  }

  if (parts.length === 0) {
    return null
  }

  return (
    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '14px' }}>
      {parts.join(' and ')}.{' '}
      <Typography
        component="span"
        variant="caption"
        onClick={onOpenManageTokens}
        sx={{
          color: 'primary.light',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'normal',
        }}
      >
        Manage Tokens
      </Typography>
    </Typography>
  )
}
