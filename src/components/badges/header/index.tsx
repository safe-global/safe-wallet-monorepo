import { Box, Grid, Skeleton, Stack, SvgIcon, Typography } from '@mui/material'
import Badge from '@/public/images/common/superChain.svg'

function BadgesHeader({
  level,
  points,
  pointsToNextLevel,
  completeBadges,
  totalBadges,
  isLoading,
}: {
  level?: number
  points?: number
  completeBadges: number
  pointsToNextLevel?: number
  totalBadges?: number
  isLoading: boolean
}) {
  return (
    <Grid item pb={2} xs={12}>
      <Grid container display="flex" justifyContent="space-between">
        <Grid xs={6} lg={3} display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Current level
          </Typography>

          {isLoading ? (
            <Skeleton variant="text" width={44} height={44} />
          ) : (
            <Typography variant="h4" fontWeight={600} color="secondary" fontSize={44}>
              {level}
            </Typography>
          )}
        </Grid>
        <Grid xs={6} lg={3} display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Your SC Points
          </Typography>
          <Grid xs={6} lg={3} display="flex" justifyContent="flex-start" alignItems="center" gap={1}>
            {isLoading ? (
              <Skeleton variant="text" width={88} height={44} />
            ) : (
              <>
                <Typography variant="h4" fontWeight={600} fontSize={44}>
                  {points}
                </Typography>
                <SvgIcon component={Badge} inheritViewBox fontSize="large" />
              </>
            )}
          </Grid>
        </Grid>
        <Grid xs={6} lg={3} display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            SC Points to next level
          </Typography>
          <Box display="flex" justifyContent="flex-start" alignItems="center" gap={1}>
            {isLoading ? (
              <Skeleton variant="text" width={88} height={44} />
            ) : (
              <>
                <Typography variant="h4" fontWeight={600} fontSize={44}>
                  {pointsToNextLevel}
                </Typography>
                <SvgIcon component={Badge} inheritViewBox fontSize="large" />
              </>
            )}
          </Box>
        </Grid>
        <Grid xs={6} lg={3} display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Total bagdes
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={44} height={44} />
          ) : (
            <Typography variant="h4" fontWeight={600} fontSize={44}>
              {completeBadges}/{totalBadges}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default BadgesHeader
