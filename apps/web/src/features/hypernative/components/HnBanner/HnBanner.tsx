import { PromoBanner } from '@/components/common/PromoBanner'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export const hnBannerID = 'hnBanner'

const HnBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <PromoBanner
      // TODO: check tracking events naming
      trackOpenProps={{
        category: 'hypernative',
        action: 'open_hn_banner',
        label: 'Strengthen your Safe',
      }}
      trackHideProps={{
        category: 'hypernative',
        action: 'hide_hn_banner',
        label: 'Strengthen your Safe',
      }}
      title="Strengthen your Safe"
      description="Automatically monitor and block risky transactions using advanced, user-defined security policies by Hypernative."
      ctaLabel="Learn more"
      imageSrc="/images/hypernative/guardian-badge.svg"
      imageAlt="Guardian badge"
      // TODO: add a valid link to Hypernative or to the form page instead of this placeholder:
      href={{ pathname: AppRoutes.settings.security, query: { safe: router.query.safe } }}
      onDismiss={onDismiss}
      endIcon={<ArrowForwardIcon fontSize="small" />}
      customBackground="linear-gradient(90deg, #1c5538 0%, #1c1c1c 54.327%, #1c1c1c 100%)"
      customTitleColor="var(--color-static-primary)"
      customFontColor="#A1A3A7"
      customCtaColor="var(--color-static-primary)"
      customCloseIconColor="var(--color-text-secondary)"
    />
  )
}

export default HnBanner
