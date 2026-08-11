import css from '../Dashboard/styles.module.css'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const UnauthorizedState = () => {
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className={css.content}>
        <div className={cn('text-center', css.contentWrapper)}>
          <div className={css.contentInner}>
            <Typography variant="paragraph-bold" className="mb-4">
              You don’t have permissions to this page
            </Typography>

            <Typography color="muted" className="mb-4">
              Sorry, you don’t have permissions to view this page, as your wallet is not a member of the workspace. Try
              to sign in with a different wallet or go back to the overview.
            </Typography>

            <Button variant="outline" render={<Link href={AppRoutes.welcome.spaces} />}>
              Back to homepage
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedState
