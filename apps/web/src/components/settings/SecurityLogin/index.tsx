import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { HnBannerForSettings, HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { HYPERNATIVE_SOURCE } from '@/services/analytics'
import { SecurityLoginView } from '@views/components/settings/SecurityLogin/SecurityLoginView'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()
  const hn = useLoadFeature(HypernativeFeature)

  return (
    <SecurityLoginView>
      {/* If guard is active: 
      HnActivatedSettingsBanner shows, 
      HnBannerForSettings doesn't - useBannerVisibility already ensures mutual exclusivity */}
      <hn.HnActivatedSettingsBanner />
      <HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </SecurityLoginView>
  )
}

export default SecurityLogin
