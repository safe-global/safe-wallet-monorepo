import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import SvgIcon from '@mui/material/SvgIcon'
import NetworkError from '@/public/images/apps/network-error.svg'

import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { DISCORD_URL } from '@safe-global/utils/config/constants'

type SafeAppsLoadErrorProps = {
  onBackToApps: () => void
}

const SafeAppsLoadError = ({ onBackToApps }: SafeAppsLoadErrorProps): React.ReactElement => {
  return (
    <div className={css.wrapper}>
      <div className={css.content}>
        <Typography variant="h1">Safe App could not be loaded</Typography>

        <SvgIcon component={NetworkError} inheritViewBox className={css.image} />

        <div>
          <Typography component="span">In case the problem persists, please reach out to us via </Typography>
          <ExternalLink href={DISCORD_URL} fontSize="medium">
            Discord
          </ExternalLink>
        </div>

        <Button href="#back" color="primary" onClick={onBackToApps}>
          Go back to the Safe Apps list
        </Button>
      </div>
    </div>
  )
}

export default SafeAppsLoadError
