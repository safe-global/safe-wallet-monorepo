import NetworkError from '@/public/images/apps/network-error.svg'

import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
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

        <NetworkError className={css.image} />

        <div>
          <Typography variant="paragraph" className="inline">
            In case the problem persists, please reach out to us via{' '}
          </Typography>
          <ExternalLink href={DISCORD_URL}>Discord</ExternalLink>
        </div>

        <Button variant="ghost" onClick={onBackToApps} render={<a href="#back" />}>
          Go back to the Safe Apps list
        </Button>
      </div>
    </div>
  )
}

export default SafeAppsLoadError
