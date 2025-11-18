import { Skeleton, Box } from '@mui/material'
import { PromoBanner } from '@/components/common/PromoBanner'

export const SkeletonBanner = () => {
  return (
    <PromoBanner
      title=" "
      description={
        <Box>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="70%" height={20} />
        </Box>
      }
      ctaLabel=" "
      ctaDisabled
      trackingEvents={{ category: '', action: '', label: '' }}
      customBackground="linear-gradient(90deg, #b0ffc9, #d7f6ff)"
    />
  )
}
