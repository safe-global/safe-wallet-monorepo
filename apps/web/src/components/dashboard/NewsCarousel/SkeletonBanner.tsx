import { Card, Skeleton, Stack, Box } from '@mui/material'
import css from '@/components/common/PromoBanner/styles.module.css'

export const SkeletonBanner = () => {
  return (
    <Card className={css.banner}>
      <Stack direction="row" spacing={2} className={css.bannerStack}>
        {/* Image skeleton - only on desktop */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            flexShrink: 0,
          }}
        >
          <Skeleton variant="rectangular" width={95} height={95} sx={{ borderRadius: '8px' }} />
        </Box>

        <Box className={css.bannerContent}>
          {/* Title skeleton */}
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />

          {/* Description skeleton */}
          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />

          {/* CTA button skeleton */}
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: '4px' }} />
        </Box>
      </Stack>
    </Card>
  )
}
