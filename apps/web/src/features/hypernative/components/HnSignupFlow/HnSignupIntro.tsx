import { Typography, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'
import Track from '@/components/common/Track'
import { HYPERNATIVE_EVENTS } from '@/services/analytics'
import { useTheme } from '@mui/material/styles'
import HypernativeLogo from '../HypernativeLogo'

export type HnSignupIntroProps = {
  onGetStarted: () => void
  onClose: () => void
}

const HnSignupIntro = ({ onGetStarted, onClose }: HnSignupIntroProps) => {
  const theme = useTheme()

  const features = [
    {
      title: 'Automatic blocking',
      description: "Automatically prevents malicious or non-compliant transactions before they're executed",
    },
    {
      title: 'Custom security rules',
      description: 'Create tailored policies using granular parameters to stop unwanted transactions.',
    },
    {
      title: 'Seamless integration',
      description: 'Works natively within your Safe workflow. No extra steps required.',
    },
  ]

  return (
    <HnSignupLayout contentClassName={css.introColumn}>
      <div className={css.contentWrapper}>
        <div className={css.header}>
          <Typography variant="h1" className={css.title}>
            Guardian
          </Typography>
          <div className={css.poweredBy}>
            <Typography variant="body2" className={css.poweredByText}>
              powered by
            </Typography>
            <HypernativeLogo fill={theme.palette.primary.light} sx={{ width: 66 }} />
          </div>
          <Typography variant="body2" className={css.subtitle}>
            Enterprise-level protection for teams and organizations.
          </Typography>
        </div>

        <div className={css.features}>
          {features.map((feature, index) => (
            <div key={index} className={css.feature}>
              <CheckCircleIcon className={css.featureIcon} />
              <div>
                <Typography variant="body2" fontWeight={600} className={css.featureTitle}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" className={css.featureDescription}>
                  {feature.description}
                </Typography>
              </div>
            </div>
          ))}
        </div>

        <div className={css.actions}>
          <Track
            // Mixpanel: The event name is automatically determined from the GA_TO_MIXPANEL_MAPPING based on the action
            {...HYPERNATIVE_EVENTS.GUARDIAN_FORM_STARTED}
          >
            <Button variant="contained" fullWidth onClick={onGetStarted} className={css.primaryButton}>
              Get started
            </Button>
          </Track>
          <Button variant="text" fullWidth onClick={onClose} className={css.secondaryButton}>
            Close
          </Button>
        </div>
      </div>
    </HnSignupLayout>
  )
}

export default HnSignupIntro
