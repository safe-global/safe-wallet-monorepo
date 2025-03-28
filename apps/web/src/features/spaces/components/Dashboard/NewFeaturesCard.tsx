import WhatsNewIcon from '@/public/images/common/whatsnew.svg'
import { Typography, Paper, Box, SvgIcon, Chip } from '@mui/material'
import css from './styles.module.css'

const NewFeaturesCard = () => {
  return (
    <Paper sx={{ p: 3, borderRadius: '12px' }}>
      <Box position="relative" width={1}>
        <Box className={css.iconBG}>
          <SvgIcon component={WhatsNewIcon} inheritViewBox />
        </Box>

        <Chip label="Coming soon" size="small" sx={{ position: 'absolute', top: 0, right: 0, fontWeight: 'bold' }} />
      </Box>
      <Box>
        <Typography variant="body1" color="text.primary" fontWeight={700} mb={1}>
          New exciting features
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Address book sharing, viewing transactions across accounts and more is coming soon. Stay tuned for updates!
        </Typography>
      </Box>
    </Paper>
  )
}

export default NewFeaturesCard
