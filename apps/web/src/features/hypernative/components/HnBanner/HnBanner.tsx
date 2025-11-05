import { PromoBanner } from '@/components/common/PromoBanner'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

export const hnBannerID = 'hnBanner'

const HnBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const imageSrc: string = '/images/common/hypernative/guardian-badge.svg'
  const customClass: string = 'hnBannerDark'

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
    // TODO useLocalStorage later
  }

  if (!isVisible) return null

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
      imageSrc={imageSrc}
      imageAlt="Guardian badge"
      // TODO: add a valid link to Hypernative or to the form page instead of this placeholder:
      href={{ pathname: AppRoutes.settings.security, query: { safe: router.query.safe } }}
      onDismiss={handleDismiss}
      endIcon={<ChevronRightIcon fontSize="small" />}
      variant="dark"
      customClass={customClass}
    />
  )
}

export default HnBanner
