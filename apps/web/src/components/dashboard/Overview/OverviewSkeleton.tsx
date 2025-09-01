import { Card, Box, Stack, Typography, Skeleton } from '@mui/material'
import { type ReactElement } from 'react'

const OverviewSkeleton = (): ReactElement => {
  return (
    <Card sx={{ border: 0, p: 3 }} component="section">
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography color="primary.light" fontWeight="bold" mb={1}>
              Total asset value
            </Typography>
            <Skeleton variant="text" />
          </Box>

          <Stack
            direction="row"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            flexWrap={{ xs: 'wrap', md: 'nowrap' }}
            gap={1}
            width={{ xs: 1, md: 'auto' }}
            mt={{ xs: 2, md: 0 }}
          >
            <Box flex={1}>
              <Skeleton
                variant="rounded"
                height={42}
                sx={{
                  minWidth: 96,
                  width: '100%',
                }}
              />
            </Box>
            <Box flex={1}>
              <Skeleton
                variant="rounded"
                height={42}
                sx={{
                  minWidth: 96,
                  width: '100%',
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Card>
  )
}
export default OverviewSkeleton
