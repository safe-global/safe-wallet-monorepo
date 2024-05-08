import { Box, Grid, SvgIcon, Typography } from '@mui/material'
import Badge from '@/public/images/common/superChain.svg'

function BadgesHeader() {
  return (
    <Grid item pb={2} xs={12}>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Current level
          </Typography>
          <Typography variant="h4" fontWeight={600} color="secondary" fontSize={44}>
            2
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Your SC Points
          </Typography>
          <Box display="flex" justifyContent="flex-start" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={600} fontSize={44}>
              35
            </Typography>
            <SvgIcon component={Badge} inheritViewBox fontSize="large" />
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            SC Points to next level
          </Typography>
          <Box display="flex" justifyContent="flex-start" alignItems="center" gap={1}>
            <Typography variant="h4" fontWeight={600} fontSize={44}>
              40
            </Typography>
            <SvgIcon component={Badge} inheritViewBox fontSize="large" />
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="h3" fontSize={16} fontWeight={600} color="primary.light">
            Total bagdes
          </Typography>
          <Typography variant="h4" fontWeight={600} fontSize={44}>
            1/40
          </Typography>
        </Box>
      </Box>
    </Grid>
  )
}

export default BadgesHeader
