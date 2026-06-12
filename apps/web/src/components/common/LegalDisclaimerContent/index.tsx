import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'
import { type ReactElement } from 'react'
import css from './styles.module.css'

const LegalDisclaimerContent = ({
  withTitle = true,
  isSafeApps = true,
}: {
  withTitle?: boolean
  isSafeApps?: boolean
}): ReactElement => (
  <div className={css.disclaimerContainer}>
    {withTitle && (
      <Typography variant="h3" className="my-6 font-bold">
        Disclaimer
      </Typography>
    )}
    <div className={css.disclaimerInner}>
      <Typography className="mb-8">
        You are now accessing {isSafeApps ? 'third-party apps' : 'a third-party app'}, which we do not own, control,
        maintain or audit. We are not liable for any loss you may suffer in connection with interacting with the{' '}
        {isSafeApps ? 'apps' : 'app'}, which is at your own risk.
      </Typography>

      <Typography className="mb-8">
        You must read our Terms, which contain more detailed provisions binding on you relating to the{' '}
        {isSafeApps ? 'apps' : 'app'}.
      </Typography>

      <Typography>
        I have read and understood the{' '}
        <ExternalLink href={AppRoutes.terms} className="no-underline hover:no-underline">
          Terms
        </ExternalLink>{' '}
        and this Disclaimer, and agree to be bound by them.
      </Typography>
    </div>
  </div>
)

export default LegalDisclaimerContent
