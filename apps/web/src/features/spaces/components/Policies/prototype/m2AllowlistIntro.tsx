import { useId, useState, type ReactElement } from 'react'
import { ArrowRight, Check, Send, UsersRound, X } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { PROTECTION_FACTS } from './m2SetupFlow'
import { cn } from '@safe-global/views/utils/cn'
import { usePrototypeModel } from './m2Prototype'

/** Illustrative only: the values are invented and the copy explains the check. */
const PREVIEW_SAFE = '0x8674ff2cC41CE1A26D0A1B4b8f6c8B58F7bca19b'

const PlaceholderBar = ({ className }: { className: string }): ReactElement => (
  <span className={`h-2.5 rounded-full bg-muted ${className}`} />
)

const OUTCOMES = [
  { allowed: true, label: 'Allowed', Icon: Check },
  { allowed: false, label: 'Blocked', Icon: X },
]

/** Static, in the style of M1's intro previews: one Safe account, one transaction, the two things that can happen to it. */
const EnforcementPreview = (): ReactElement => (
  <div
    aria-hidden
    className="flex h-[148px] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-sunken px-4"
    data-m2-new="New · Account protection preview"
  >
    {/* C's narrower dialog: the same picture, scaled down to fit. */}
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 whitespace-nowrap',
        usePrototypeModel() === 'simple' && 'origin-center scale-[0.82]',
      )}
    >
      <div className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Identicon address={PREVIEW_SAFE} size={28} />
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-mini-medium">Safe account</Typography>
            <PlaceholderBar className="w-14" />
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
          <UsersRound className="size-3 text-muted-foreground" />
          <Typography variant="paragraph-mini-medium">2/3</Typography>
        </span>
      </div>

      <span className="w-4 shrink-0 border-t border-dashed border-border" />

      <div className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-sm">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted">
          <Send className="size-3.5 text-muted-foreground" />
        </span>
        <div className="flex flex-col gap-1">
          <Typography variant="paragraph-mini-medium">Transaction</Typography>
          <PlaceholderBar className="w-12" />
        </div>
      </div>

      {/* One line splits into the two outcomes. */}
      <span className="h-[52px] w-4 shrink-0 rounded-l-md border-y border-l border-dashed border-border" />

      <div className="flex flex-col gap-3">
        {OUTCOMES.map(({ allowed, label, Icon }) => (
          <div key={label} className="flex items-center rounded-xl bg-card p-2 shadow-sm">
            <Badge variant={allowed ? 'success' : 'destructive'} size="status" shape="status">
              <Icon aria-hidden />
              {label}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export type AllowlistIntroDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
}

/** Account protection's intro, laid out like M1's PolicyIntroDialog, plus bold titles and "I understand". */
export const AllowlistIntroDialog = ({ open, onOpenChange, onProceed }: AllowlistIntroDialogProps): ReactElement => {
  const [hasUnderstood, setHasUnderstood] = useState(false)
  const checkboxId = useId()
  // C: the same width as the other policies' intros, and no "I understand" before Set up.
  const isSimpleModel = usePrototypeModel() === 'simple'
  // B lists every rule it can hold, and which one is required.
  const facts =
    usePrototypeModel() === 'policies'
      ? PROTECTION_FACTS.map((fact, index) =>
          index === 0
            ? {
                ...fact,
                description: 'Account changes, allowlist, spending limits and proposers.',
              }
            : fact,
        )
      : PROTECTION_FACTS

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setHasUnderstood(false)
        onOpenChange(next)
      }}
    >
      <DialogContent size={isSimpleModel ? 'xs' : 'sm'} data-testid="account-protection-intro-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-semibold">Account protection</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-5" data-m2-new="New · Account protection intro">
          <DialogDescription className="text-base leading-6 text-secondary-foreground">
            Make sure your Safe account can only do what your policies allow.{' '}
            <ExternalLink
              href={HelpCenterArticle.POLICIES}
              className="font-normal [&>span]:underline [&>span]:decoration-current [&>span]:underline-offset-2"
            >
              Learn more about account protection
            </ExternalLink>
          </DialogDescription>

          <EnforcementPreview />

          <ul className="flex flex-col gap-4">
            {facts.map(({ Icon, title, description }) => (
              <li key={title} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-light-hover)]">
                  <Icon className="size-4 text-badge-dot-success" aria-hidden />
                </div>
                <div className="flex flex-col">
                  <Typography variant="paragraph-small-bold">{title}</Typography>
                  <Typography variant="paragraph-small" color="muted">
                    {description}
                  </Typography>
                </div>
              </li>
            ))}
          </ul>

          {!isSimpleModel && (
            <label
              htmlFor={checkboxId}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
              data-m2-new="New · I understand"
            >
              <Checkbox
                id={checkboxId}
                checked={hasUnderstood}
                onCheckedChange={(checked) => setHasUnderstood(checked === true)}
              />
              <Typography variant="paragraph-small">
                I understand that anything my policies don’t allow will be blocked, and that future changes take 24
                hours to apply.
              </Typography>
            </label>
          )}

          <Button
            className="w-full gap-2"
            disabled={!isSimpleModel && !hasUnderstood}
            onClick={() => {
              setHasUnderstood(false)
              onProceed()
            }}
          >
            Set up
            <ArrowRight className="text-[var(--color-static-text-brand)] dark:text-black" aria-hidden />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
