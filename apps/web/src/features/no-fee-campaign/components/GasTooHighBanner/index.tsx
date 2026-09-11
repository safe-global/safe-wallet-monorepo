import { InfoIcon } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

const GasTooHighBanner = () => {
  return (
    <div className={css.banner}>
      <div className={css.iconContainer}>
        <InfoIcon className={css.icon} />
      </div>
      <div className={css.messageContainer}>
        <Typography variant="paragraph-small" className={css.message}>
          Gas prices are too high right now for sponsoring. Please try again later or use your connected wallet.
        </Typography>
      </div>
    </div>
  )
}

export default GasTooHighBanner
