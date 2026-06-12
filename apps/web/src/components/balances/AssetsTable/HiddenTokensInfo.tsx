import { Typography } from '@/components/ui/typography'
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
    <Typography variant="paragraph-mini" className="text-[14px] text-[var(--color-text-secondary)]">
      {parts.join(' and ')}.{' '}
      <Typography
        variant="paragraph-mini"
        onClick={onOpenManageTokens}
        className="cursor-pointer text-[14px] text-[var(--color-primary-light)] underline"
      >
        Manage Tokens
      </Typography>
    </Typography>
  )
}
