import { Typography } from '@/components/ui/typography'

export type HiddenTokensInfoViewProps = {
  hiddenByTokenList: number
  hiddenByDustFilter: number
  onOpenManageTokens?: () => void
}

export const HiddenTokensInfoView = ({
  hiddenByTokenList,
  hiddenByDustFilter,
  onOpenManageTokens,
}: HiddenTokensInfoViewProps) => {
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
