import { WORKSPACE_ANNOUNCEMENT_URL } from '@/config/constants'
import { WorkspaceBannerView } from '@views/features/spaces/components/WorkspaceBanner/WorkspaceBannerView'

const WorkspaceBanner = (props: { className?: string }) => {
  return <WorkspaceBannerView {...props} announcementUrl={WORKSPACE_ANNOUNCEMENT_URL} />
}

export default WorkspaceBanner
