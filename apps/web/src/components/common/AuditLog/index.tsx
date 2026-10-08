import { type ReactElement, useState, useCallback, useRef, useEffect } from 'react'
import { AuditRowView, type AuditRowViewProps } from '@views/components/common/AuditLog/AuditLogView'

export {
  ACTION_ICONS,
  formatAuditDateTime,
  AuditLogView as AuditLog,
  AuditLogHeaderView as AuditLogHeader,
  type ActionType,
} from '@views/components/common/AuditLog/AuditLogView'

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

export type AuditRowProps = Omit<AuditRowViewProps, 'copied' | 'onCopy'>

export const AuditRow = (props: AuditRowProps): ReactElement => {
  const [copied, handleCopy] = useCopyToClipboard(props.address)

  return <AuditRowView {...props} copied={copied} onCopy={handleCopy} />
}
