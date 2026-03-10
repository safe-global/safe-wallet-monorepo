import SpacesIllustration from '@/public/images/common/spaces-illustration.png'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { AppRoutes } from '@/config/routes'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'

export const spacesBannerID = 'spacesBanner'

export const SpacesBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <PromoBanner
      title="New! Improved Spaces."
      description="All your Safe Accounts, finally organized. Streamlined for teams and solo users alike"
      ctaLabel="Try now"
      href={AppRoutes.welcome.spaces}
      imageSrc={SpacesIllustration}
      imageAlt="Spaces illustration"
      endIcon={<ChevronRightIcon fontSize="small" />}
      ctaVariant="text"
      trackingEvents={{ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.safe_dashboard_banner }}
      trackHideProps={SPACE_EVENTS.HIDE_DASHBOARD_WIDGET}
      onDismiss={onDismiss}
    />
  )
}
