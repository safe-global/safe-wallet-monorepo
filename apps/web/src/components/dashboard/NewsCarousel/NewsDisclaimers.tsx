import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { NEWS_BANNER_STORAGE_KEY } from '@/components/dashboard/NewsCarousel/utils'
import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { earnBannerDisclaimer, earnBannerID } from '@/components/dashboard/NewsCarousel/banners/EarnBanner'
import usePortfolio from '@/hooks/usePortfolio'

const disclaimers = [
  {
    id: earnBannerID,
    element: earnBannerDisclaimer,
  },
]

const NewsDisclaimers = () => {
  const [dismissed = []] = useLocalStorage<string[]>(NEWS_BANNER_STORAGE_KEY)
  const { visibleTokenBalances, isLoading: balancesLoading } = usePortfolio()
  const nonZeroBalances = useMemo(() => {
    return visibleTokenBalances.filter((item) => item.balance !== '0')
  }, [visibleTokenBalances])

  const noAssets = !balancesLoading && nonZeroBalances.length === 0

  const items = useMemo(() => disclaimers.filter((b) => !dismissed.includes(b.id)), [dismissed])

  if (noAssets) return null

  return (
    <>
      {items.map((item) => (
        <Typography component="p" key={item.id} variant="caption" color="text.secondary" mb={1}>
          {item.element}
        </Typography>
      ))}
    </>
  )
}

export default NewsDisclaimers
