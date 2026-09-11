import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

const linkClassName = 'no-underline hover:no-underline'

const WidgetDisclaimer = ({ widgetName }: { widgetName: string }) => (
  <div className={css.disclaimerContainer}>
    <div className={css.disclaimerInner}>
      <Typography className="mb-8 mt-8">You are now accessing a third party widget.</Typography>

      <Typography className="mb-8">
        Please note that we do not own, control, maintain or audit the {widgetName}. Use of the widget is subject to
        third party terms & conditions. We are not liable for any loss you may suffer in connection with interacting
        with the widget, which is at your own risk.
      </Typography>

      <Typography className="mb-8">
        Our{' '}
        <ExternalLink href={AppRoutes.terms} className={linkClassName}>
          terms
        </ExternalLink>{' '}
        contain more detailed provisions binding on you relating to such third party content.
      </Typography>
      <Typography>
        By clicking &quot;continue&quot; you re-confirm to have read and understood our{' '}
        <ExternalLink href={AppRoutes.terms} className={linkClassName}>
          terms
        </ExternalLink>{' '}
        and this message, and agree to them.
      </Typography>
    </div>
  </div>
)

export default WidgetDisclaimer
