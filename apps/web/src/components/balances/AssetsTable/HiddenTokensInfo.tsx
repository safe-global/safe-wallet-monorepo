import { useHiddenTokenCounts } from '@/hooks/useHiddenTokenCounts'
import { HiddenTokensInfoView } from '@views/components/balances/AssetsTable/HiddenTokensInfoView'

interface HiddenTokensInfoProps {
  onOpenManageTokens?: () => void
}

export const HiddenTokensInfo = ({ onOpenManageTokens }: HiddenTokensInfoProps) => {
  const { hiddenByTokenList, hiddenByDustFilter } = useHiddenTokenCounts()

  return (
    <HiddenTokensInfoView
      hiddenByTokenList={hiddenByTokenList}
      hiddenByDustFilter={hiddenByDustFilter}
      onOpenManageTokens={onOpenManageTokens}
    />
  )
}
