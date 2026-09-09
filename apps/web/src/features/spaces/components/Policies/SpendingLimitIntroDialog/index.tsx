import { useRef, type ReactElement } from 'react'
import { ArrowRight, CalendarClock, HandCoins, Info, UsersRound, type LucideIcon } from 'lucide-react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SpendingLimitPreview from './SpendingLimitPreview'

/**
 * The three things someone must understand before signing: a spender is not a signer, a limit is
 * a token/amount/period that resets, and only creating it costs a transaction. Copy is verbatim
 * from the design.
 */
const EXPLAINERS: { Icon: LucideIcon; text: string }[] = [
  {
    Icon: UsersRound,
    text: "Anyone can be a spender, they don't need to be signers of this Safe account.",
  },
  {
    Icon: CalendarClock,
    text: 'Choose a token and an amount per day, week, or month. When the period ends, the limit resets automatically.',
  },
  {
    Icon: HandCoins,
    text: "Creating the limit requires a transaction. Once it's active, spending within the limit needs no further approvals.",
  },
]

export interface SpendingLimitIntroDialogProps {
  open: boolean
  /** Called with `false` on every dismissal — the close button, Escape and a click outside. */
  onOpenChange: (open: boolean) => void
  /** Called when the user chooses to continue into the spending limit flow. */
  onProceed: () => void
}

/**
 * Explains what a spending limit is before the flow starts, so the consequences are not
 * discovered after signing. Dismissing it starts nothing.
 */
const SpendingLimitIntroDialog = ({ open, onOpenChange, onProceed }: SpendingLimitIntroDialogProps): ReactElement => {
  // Without this the dialog opens with the title's help link focused, which both rings a 16px
  // icon and puts "open a new tab" one Enter away from someone who only wants to read on.
  const proceedRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xs" initialFocus={proceedRef} data-testid="spending-limit-intro-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl leading-6 font-semibold">
            Spending limit
            <ExternalLink
              href={HelpCenterArticle.SPENDING_LIMITS}
              noIcon
              aria-label="Learn more about spending limits"
              className="text-muted-foreground no-underline hover:text-foreground"
            >
              <Info className="size-4" aria-hidden />
            </ExternalLink>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-5 pb-5">
          <DialogDescription className="text-base leading-6 text-secondary-foreground">
            Let spenders access assets without collecting signatures.
          </DialogDescription>

          <SpendingLimitPreview />

          <div className="flex flex-col gap-8">
            <ul className="flex flex-col gap-8">
              {EXPLAINERS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-light-hover)]">
                    <Icon className="size-4 text-badge-dot-success" aria-hidden />
                  </div>

                  <Typography variant="paragraph-small" color="muted">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>

            <Button ref={proceedRef} className="w-full gap-2" onClick={onProceed}>
              Set up spending limit
              {/* Brand green on the light button; the dark button is already green, so its icon stays black. */}
              <ArrowRight className="text-[var(--color-static-text-brand)] dark:text-black" aria-hidden />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SpendingLimitIntroDialog
