import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { NEWS_BANNER_STORAGE_KEY } from '@/components/dashboard/NewsCarousel/utils'
import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { earnBannerDisclaimer, earnBannerID } from '@/components/dashboard/NewsCarousel/banners/EarnBanner'

const disclaimers = [
  {
    id: earnBannerID,
    element: earnBannerDisclaimer,
  },
]

const NewsDisclaimers = () => {
  const [dismissed = []] = useLocalStorage<string[]>(NEWS_BANNER_STORAGE_KEY)

  const items = useMemo(() => disclaimers.filter((b) => !dismissed.includes(b.id)), [dismissed])

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
