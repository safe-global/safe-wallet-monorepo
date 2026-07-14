import { memo, type ReactElement, useMemo, useState } from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'

import { cn } from '@/utils/cn'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import type { BrowserPermission } from '@/hooks/safe-apps/permissions'
import Slider from './Slider'
import AllowedFeaturesList from './AllowedFeaturesList'
import type { AllowedFeatures, AllowedFeatureSelection } from '../types'
import { PermissionStatus } from '../types'
import UnknownAppWarning from './UnknownAppWarning'
import { getOrigin } from '../utils'
import LegalDisclaimerContent from '@/components/common/LegalDisclaimerContent'

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
    <div className="flex h-[calc(100vh-52px)] flex-col items-center justify-center">
      <div
        data-testid="app-info-modal"
        className="w-[450px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      >
        {totalSlides > 1 && (
          <ProgressPrimitive.Root value={progressValue} className="block">
            <ProgressTrack className="h-1.5 rounded-none bg-muted">
              <ProgressIndicator
                className={cn(
                  'rounded-lg',
                  progressValue === 100 && shouldShowUnknownAppWarning
                    ? 'bg-[var(--color-warning-main)]'
                    : 'bg-[var(--color-primary-main)]',
                )}
              />
            </ProgressTrack>
          </ProgressPrimitive.Root>
        )}
        <div className="flex flex-col p-6 text-center">
          <Slider onSlideChange={handleSlideChange}>
            {!isConsentAccepted && <LegalDisclaimerContent />}

            {!isPermissionsReviewCompleted && (
              <AllowedFeaturesList
                features={selectedFeatures}
                onFeatureSelectionChange={handleFeatureSelectionChange}
              />
            )}

            {shouldShowUnknownAppWarning && <UnknownAppWarning url={origin} onHideWarning={setHideWarning} />}
          </Slider>
        </div>
      </div>
    </div>
  )
}

export default memo(SafeAppsInfoModal)
