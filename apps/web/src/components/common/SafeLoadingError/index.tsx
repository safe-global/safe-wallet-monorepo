import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeLegalBlockMessage from '@/hooks/useSafeLegalBlockMessage'
import PagePlaceholder from '../PagePlaceholder'
import { AppRoutes } from '@/config/routes'
import Link from 'next/link'

export const GENERIC_LOADING_ERROR = "This Safe account couldn't be loaded"

const SafeLoadingError = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeError } = useSafeInfo()
  const legalBlockMessage = useSafeLegalBlockMessage()

  if (!safeError) return <>{children}</>

  return (
    <PagePlaceholder
      img={<img src="/images/common/error.png" alt="A vault with a red icon in the bottom right corner" />}
      text={legalBlockMessage ?? GENERIC_LOADING_ERROR}
      testId="safe-loading-error"
    >
      <Button size="lg" className="mt-4" data-testid="safe-loading-error-cta" render={<Link href={AppRoutes.index} />}>
        Go to the main page
      </Button>
    </PagePlaceholder>
  )
}

export default SafeLoadingError
