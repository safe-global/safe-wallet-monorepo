import { type ReactElement, type ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import { type LucideIcon, Plus, Check, PenLine, Clock, CircleAlert } from 'lucide-react'
import classNames from 'classnames'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

import css from './styles.module.css'

export type ActionType = 'created' | 'signed' | 'executed' | 'confirmed' | 'pending' | 'expired'

export const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  created: Plus,
  signed: PenLine,
  executed: Check,
  confirmed: Check,
  pending: Clock,
  expired: CircleAlert,
}

const auditDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export const formatAuditDateTime = (ts: number): string => auditDateFormatter.format(new Date(ts))

const COPIED_TOOLTIP_MS = 750

export const useCopyToClipboard = (text?: string | null): [boolean, () => void] => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = useCallback(() => {
    if (!text) return
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), COPIED_TOOLTIP_MS)
      })
      .catch(() => {})
  }, [text])

  return [copied, handleCopy]
}

export const AuditLogHeader = ({ chip, actions }: { chip?: ReactNode; actions?: ReactNode }): ReactElement => (
  <>
    <div className="mb-2 flex items-center gap-2">
      <Typography variant="paragraph-small" className="font-bold tracking-[0.05em] uppercase">
        Audit log
      </Typography>
      {chip}
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </div>
    <Separator bleed="auto" className={classNames('mb-4', css.headerDivider)} />
  </>
)

export type AuditRowProps = {
  label: string
  actionType: ActionType
  address?: string
  name?: string | null
  /** Actor label (e.g. a service name, optionally linked) when there is no address to copy. */
  actor?: ReactNode
  timestamp?: number | null
  isLast?: boolean
  /** CSS color for the timeline icon (e.g. 'var(--color-error-main)'); defaults to primary. */
  iconColor?: string
}

export const AuditRow = ({
  label,
  actionType,
  address,
  name,
  actor,
  timestamp,
  isLast,
  iconColor,
}: AuditRowProps): ReactElement => {
  const displayText = address ? name || shortenAddress(address) : undefined
  const [copied, handleCopy] = useCopyToClipboard(address)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCopy()
      }
    },
    [handleCopy],
  )

  const ActionIcon = ACTION_ICONS[actionType]
  const showActor = displayText && address
  const showDash = !showActor && !actor && !isLast

  return (
    <div className={css.auditRow}>
      {/* Column 1: Timeline icon with vertical connector */}
      <div className={css.timelineCol}>
        <div className={css.timelineIcon}>
          <ActionIcon
            className="size-3.5 text-[var(--color-primary-main)]"
            style={iconColor ? { color: iconColor } : undefined}
          />
        </div>
        {!isLast && <div className={css.timelineLine} />}
      </div>

      {/* Column 2: Action label + actor/origin */}
      <div className={css.infoCol}>
        <Typography variant="paragraph-small" className="truncate font-semibold leading-[1.4]">
          {label}
        </Typography>
        {(showActor || actor || showDash) && (
          <div className={css.actorRow}>
            {showActor ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div
                      className={css.actorCopy}
                      onClick={handleCopy}
                      onKeyDown={handleKeyDown}
                      role="button"
                      tabIndex={0}
                    >
                      <Typography variant="paragraph-mini" className={`${css.actorText} text-muted-foreground`}>
                        By {displayText}
                      </Typography>
                    </div>
                  }
                />
                <TooltipContent side="top">{copied ? 'Copied' : 'Click to copy address'}</TooltipContent>
              </Tooltip>
            ) : actor ? (
              <Typography variant="paragraph-mini" className="text-muted-foreground">
                By {actor}
              </Typography>
            ) : (
              <Typography variant="paragraph-mini" className="text-muted-foreground">
                —
              </Typography>
            )}
          </div>
        )}
      </div>

      {/* Column 3: Timestamp */}
      <Typography variant="paragraph-mini" className={`${css.timestamp} text-muted-foreground`}>
        {timestamp != null ? formatAuditDateTime(timestamp) : ''}
      </Typography>
    </div>
  )
}
