import type { ReactNode } from 'react'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type SignedOutStateViewProps = {
  isDarkMode: boolean
  isEmailSignInEnabled: boolean
  signInOptions: ReactNode
}

export const SignedOutStateView = ({ isDarkMode, isEmailSignInEnabled, signInOptions }: SignedOutStateViewProps) => (
  <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
    <div className={css.content}>
      <div className={cn('text-center', css.contentWrapper)}>
        <div className={css.contentInner}>
          <Typography variant="paragraph-bold" className="mb-4">
            Sign in to see content
          </Typography>

          <Typography color="muted" className="mb-4">
            To view and interact with Workspaces, you need to sign in with the wallet, that is a member of the Workspace
            {isEmailSignInEnabled && ', or sign in with email'}. Sign in to continue.
          </Typography>

          {signInOptions}
        </div>
      </div>
    </div>
  </div>
)
