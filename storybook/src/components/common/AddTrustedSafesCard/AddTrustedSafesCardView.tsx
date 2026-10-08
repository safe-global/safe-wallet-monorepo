import type { ReactNode } from 'react'
import { Settings2 } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type AddAccountsChooserSlotProps = { buttonVariant: 'secondary'; className: string }

export type AddTrustedSafesCardViewProps = {
  isDarkMode: boolean
  onAdd: () => void
  renderAddAccountsChooser: (props: AddAccountsChooserSlotProps) => ReactNode
}

export const AddTrustedSafesCardView = ({
  isDarkMode,
  onAdd,
  renderAddAccountsChooser,
}: AddTrustedSafesCardViewProps) => {
  return (
    <div className={cn('shadcn-scope flex justify-center pt-10', isDarkMode && 'dark')}>
      <div
        data-testid="add-trusted-safes-card"
        className="flex w-full max-w-[440px] flex-col items-center gap-8 rounded-3xl bg-card px-4 pt-6 pb-4"
      >
        <div className="flex flex-col items-center gap-3">
          <Typography variant="h4">What are my accounts?</Typography>
          <Typography variant="paragraph-small" color="muted" align="center" className="max-w-[336px]">
            This list protects you from impersonation. Anyone can create a Safe account listing your address as a
            signer, so only accounts you&apos;ve confirmed appear here.{' '}
            <a
              href={HelpCenterArticle.ADDRESS_POISONING}
              target="_blank"
              rel="noreferrer noopener"
              className="text-inherit underline"
            >
              Learn more
            </a>
          </Typography>
        </div>

        <div className="flex w-full gap-5">
          {renderAddAccountsChooser({ buttonVariant: 'secondary', className: 'flex-1' })}

          <Button onClick={onAdd} className="flex-1" data-testid="add-trusted-safes-button">
            <Settings2 className="size-4" />
            Manage list
          </Button>
        </div>
      </div>
    </div>
  )
}
