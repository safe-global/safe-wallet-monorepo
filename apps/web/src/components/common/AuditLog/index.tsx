import { type ReactElement, type ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DoneIcon from '@mui/icons-material/Done'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

import css from './styles.module.css'

export type ActionType = 'created' | 'signed' | 'executed' | 'confirmed' | 'pending' | 'expired'

export const ACTION_ICONS: Record<ActionType, typeof AddIcon> = {
  created: AddIcon,
  signed: DrawOutlinedIcon,
  executed: DoneIcon,
  confirmed: DoneIcon,
  pending: AccessTimeIcon,
  expired: ErrorOutlineIcon,
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
    <Stack direction="row" alignItems="center" gap={1} mb={1}>
      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Audit log
      </Typography>
      {chip}
      {actions && <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>{actions}</Box>}
    </Stack>
    <Divider sx={{ mb: 2 }} />
  </>
)

export type AuditRowProps = {
  label: string
  actionType: ActionType
  address?: string
  name?: string | null
  timestamp?: number | null
  isLast?: boolean
}

export const AuditRow = ({ label, actionType, address, name, timestamp, isLast }: AuditRowProps): ReactElement => {
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
  const showDash = !showActor && !isLast

  return (
    <Box className={css.auditRow}>
      {/* Column 1: Timeline icon with vertical connector */}
      <Box className={css.timelineCol}>
        <Box className={css.timelineIcon}>
          <ActionIcon sx={{ fontSize: 14, color: 'primary.main' }} />
        </Box>
        {!isLast && <Box className={css.timelineLine} />}
      </Box>

      {/* Column 2: Action label + actor/origin */}
      <Box className={css.infoCol}>
        <Typography variant="body2" fontWeight={600} lineHeight={1.4}>
          {label}
        </Typography>
        {(showActor || showDash) && (
          <Box className={css.actorRow}>
            {showActor ? (
              <Tooltip title={copied ? 'Copied' : 'Click to copy address'} placement="top">
                <Box
                  className={css.actorCopy}
                  onClick={handleCopy}
                  onKeyDown={handleKeyDown}
                  role="button"
                  tabIndex={0}
                >
                  <Typography variant="caption" color="text.secondary" component="span" className={css.actorText}>
                    By {displayText}
                  </Typography>
                </Box>
              </Tooltip>
            ) : (
              <Typography variant="caption" color="text.secondary" component="span">
                —
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Column 3: Timestamp */}
      <Typography variant="caption" color="text.secondary" className={css.timestamp}>
        {timestamp != null ? formatAuditDateTime(timestamp) : ''}
      </Typography>
    </Box>
  )
}
