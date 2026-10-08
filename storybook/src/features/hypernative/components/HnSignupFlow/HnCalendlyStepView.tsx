import type { RefObject } from 'react'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RotateCw, ExternalLink as OpenInNewIcon } from 'lucide-react'

// Static skeleton color as the widget bg is always white (theme-independent)
const SKELETON_COLOR = '#dddee0'

export type HnCalendlyStepViewProps = {
  widgetRef: RefObject<HTMLDivElement | null>
  hasError: boolean
  showSkeleton: boolean
  isSecondStep: boolean
  onRefresh: () => void
  onOpenInNewTab: () => void
}

export const HnCalendlyStepView = ({
  widgetRef,
  hasError,
  showSkeleton,
  isSecondStep,
  onRefresh,
  onOpenInNewTab,
}: HnCalendlyStepViewProps) => {
  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        {hasError ? (
          <div className={css.errorContainer}>
            <Typography variant="h3" className={css.errorTitle}>
              Something went wrong
            </Typography>
            <Typography variant="paragraph-small" className={css.errorMessage}>
              Please reload the page.
            </Typography>
            <div className="mt-6 flex flex-col gap-4">
              <Button onClick={onRefresh} className={css.reloadButton}>
                <RotateCw />
                Reload
              </Button>
              <Button variant="outline" onClick={onOpenInNewTab} className="w-full">
                <OpenInNewIcon />
                Open in a new tab
              </Button>
            </div>
          </div>
        ) : (
          <>
            {showSkeleton && (
              <div className={css.calendlySkeletonOverlay}>
                <Skeleton className="mb-4 h-10 w-full rounded-md" style={{ backgroundColor: SKELETON_COLOR }} />
                <Skeleton className="h-10 w-full rounded-md" style={{ backgroundColor: SKELETON_COLOR }} />
              </div>
            )}
            <div
              ref={widgetRef}
              id="calendly-widget"
              className={`${css.calendlyWidget} ${!isSecondStep ? css.calendlyWidgetWithHeader : ''}`}
            />
          </>
        )}
      </div>
    </HnSignupLayout>
  )
}
