import { Box, Typography } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import css from './styles.module.css'

const GasTooHighBanner = () => {
  return (
    <Box className={css.banner}>
      <Box className={css.iconContainer}>
        <InfoIcon className={css.icon} />
      </Box>
      <Box className={css.messageContainer}>
        <Typography className={css.message}>
          Gas prices are too high right now for sponsoring. Please try again later or use your connected wallet.
        </Typography>
      </Box>
    </Box>
  )
}

export default GasTooHighBanner
