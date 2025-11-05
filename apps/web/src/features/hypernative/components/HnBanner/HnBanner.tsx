import { PromoBanner } from '@/components/common/PromoBanner'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'

export const hnBannerID = 'hnBanner'

const HnBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <PromoBanner
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
      ctaLabel="Learn more →"
      href={{ pathname: AppRoutes.settings.security, query: { safe: router.query.safe } }}
      onDismiss={onDismiss}
      endIcon={<></>}
      variant="dark"
    />
  )
}

export default HnBanner
