import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { TryDemo } from '@/components/safe-apps/SafeAppLandingPage/TryDemo'

export type SafeAppLandingPageViewProps = {
  isLoading: boolean
  details: ReactNode
  appActions: ReactNode
  showDemo: boolean
  demoUrl: UrlObject
  onDemoClick: () => void
}

export function SafeAppLandingPageView({
  isLoading,
  details,
  appActions,
  showDemo,
  demoUrl,
  onDemoClick,
}: SafeAppLandingPageViewProps): ReactElement {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-center">
        <Spinner className="size-10" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3 xl:col-span-6 xl:col-start-4">
        {/* eslint-disable-next-line no-restricted-syntax -- 48px landing-page hero padding; no p-12 Card size variant */}
        <Card className="p-12">
          {details}
          <div className="mt-8 grid grid-cols-12 gap-4">
            <div className={showDemo ? 'col-span-12 md:col-span-6' : 'col-span-12'}>{appActions}</div>
            {showDemo && (
              <div className="col-span-12 md:col-span-6">
                <TryDemo demoUrl={demoUrl} onClick={onDemoClick} />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
