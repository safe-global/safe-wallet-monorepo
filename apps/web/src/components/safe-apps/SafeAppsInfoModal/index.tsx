import { memo, type ReactElement, useMemo, useState } from 'react'
import type { BrowserPermission } from '@/hooks/safe-apps/permissions'
import Slider from './Slider'
import AllowedFeaturesList from './AllowedFeaturesList'
import type { AllowedFeatures, AllowedFeatureSelection } from '@views/components/safe-apps/types'
import { PermissionStatus } from '@views/components/safe-apps/types'
import UnknownAppWarning from '@views/components/safe-apps/SafeAppsInfoModal/UnknownAppWarning'
import { getOrigin } from '../utils'
import LegalDisclaimerContent from '@/components/common/LegalDisclaimerContent'
import { SafeAppsInfoModalView } from '@views/components/safe-apps/SafeAppsInfoModal/SafeAppsInfoModalView'

type SafeAppsInfoModalProps = {
  onCancel: () => void
  onConfirm: (shouldHide: boolean, browserPermissions: BrowserPermission[]) => void
  features: AllowedFeatures[]
  appUrl: string
  isConsentAccepted?: boolean
  isPermissionsReviewCompleted: boolean
  isSafeAppInDefaultList: boolean
  isFirstTimeAccessingApp: boolean
}

const SafeAppsInfoModal = ({
  onCancel,
  onConfirm,
  features,
  appUrl,
  isConsentAccepted,
  isPermissionsReviewCompleted,
  isSafeAppInDefaultList,
  isFirstTimeAccessingApp,
}: SafeAppsInfoModalProps): ReactElement => {
  const [hideWarning, setHideWarning] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<AllowedFeatureSelection[]>(
    features.map((feature) => {
      return {
        feature,
        checked: true,
      }
    }),
  )
  const [currentSlide, setCurrentSlide] = useState(0)

  const totalSlides = useMemo(() => {
    let totalSlides = 0

    if (!isConsentAccepted) {
      totalSlides += 1
    }

    if (!isPermissionsReviewCompleted) {
      totalSlides += 1
    }

    if (!isSafeAppInDefaultList && isFirstTimeAccessingApp) {
      totalSlides += 1
    }

    return totalSlides
  }, [isConsentAccepted, isFirstTimeAccessingApp, isPermissionsReviewCompleted, isSafeAppInDefaultList])

  const handleSlideChange = (newStep: number) => {
    const isFirstStep = newStep === -1
    const isLastStep = newStep === totalSlides

    if (isFirstStep) {
      onCancel()
    }

    if (isLastStep) {
      onConfirm(
        hideWarning,
        selectedFeatures.map(({ feature, checked }) => {
          return {
            feature,
            status: checked ? PermissionStatus.GRANTED : PermissionStatus.DENIED,
          }
        }),
      )
    }

    setCurrentSlide(newStep)
  }

  const progressValue = useMemo(() => {
    if (totalSlides <= 1) {
      return 0
    }

    return ((currentSlide + 1) * 100) / totalSlides
  }, [currentSlide, totalSlides])

  const shouldShowUnknownAppWarning = useMemo(
    () => !isSafeAppInDefaultList && isFirstTimeAccessingApp,
    [isFirstTimeAccessingApp, isSafeAppInDefaultList],
  )

  const handleFeatureSelectionChange = (feature: AllowedFeatures, checked: boolean) => {
    setSelectedFeatures(
      selectedFeatures.map((feat) => {
        if (feat.feature === feature) {
          return {
            feature,
            checked,
          }
        }
        return feat
      }),
    )
  }

  const origin = useMemo(() => getOrigin(appUrl), [appUrl])

  return (
    <SafeAppsInfoModalView
      showProgress={totalSlides > 1}
      progressValue={progressValue}
      isWarningProgress={progressValue === 100 && shouldShowUnknownAppWarning}
      slider={
        <Slider onSlideChange={handleSlideChange}>
          {!isConsentAccepted && <LegalDisclaimerContent />}

          {!isPermissionsReviewCompleted && (
            <AllowedFeaturesList features={selectedFeatures} onFeatureSelectionChange={handleFeatureSelectionChange} />
          )}

          {shouldShowUnknownAppWarning && <UnknownAppWarning url={origin} onHideWarning={setHideWarning} />}
        </Slider>
      }
    />
  )
}

export default memo(SafeAppsInfoModal)
