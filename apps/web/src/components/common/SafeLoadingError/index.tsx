import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import useSafeInfo from '@/hooks/useSafeInfo'
import PagePlaceholder from '../PagePlaceholder'
import { AppRoutes } from '@/config/routes'
import Link from 'next/link'

const SafeLoadingError = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeError } = useSafeInfo()

  if (!safeError) return <>{children}</>

  return (
    <PagePlaceholder
      img={<img src="/images/common/error.png" alt="A vault with a red icon in the bottom right corner" />}
      text="This Safe account couldn't be loaded"
    >
      <Button size="lg" className="mt-4" render={<Link href={AppRoutes.index} />}>
        Go to the main page
      </Button>
    </PagePlaceholder>
  )
}

export default SafeLoadingError
