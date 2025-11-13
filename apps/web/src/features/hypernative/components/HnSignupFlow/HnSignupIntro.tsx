import { Typography, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'

export type HnSignupIntroProps = {
  onGetStarted: () => void
  onClose: () => void
}

const HnSignupIntro = ({ onGetStarted, onClose }: HnSignupIntroProps) => {
  const features = [
    {
      title: 'Automatic blocking',
      description: 'Stops malicious or policy-violating transactions before they execute.',
    },
    {
      title: 'Custom security rules',
      description: 'Define your own policies based on a wide range of parameters to prevent unwanted transactions.',
    },
    {
      title: 'Seamless integration',
      description: 'Operates directly within your Safe transaction flow - no extra steps required.',
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
            <img src="/images/hypernative/hypernative-logo.svg" alt="Hypernative" className={css.logo} />
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
          <Button variant="contained" fullWidth onClick={onGetStarted} className={css.primaryButton}>
            Get started
          </Button>
          <Button variant="text" fullWidth onClick={onClose} className={css.secondaryButton}>
            Close
          </Button>
        </div>
      </div>
    </HnSignupLayout>
  )
}

export default HnSignupIntro
