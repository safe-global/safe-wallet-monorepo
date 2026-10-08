import type { ReactElement, ReactNode } from 'react'
import type { ActionType, AuditRowViewProps } from '@views/components/common/AuditLog/AuditLogView'
import ExternalLink from '@/components/common/ExternalLink'

export type SafenetAuditRowSlotProps = Omit<AuditRowViewProps, 'copied' | 'onCopy'>

export type SafenetAuditRowViewProps = {
  label: string
  actionType: ActionType
  iconColor?: string
  /** Links "Safenet" to the attestation transaction once the check is verified. */
  isVerified: boolean
  href: string
  isLast?: boolean
  timestamp: number | null
  renderAuditRow: (props: SafenetAuditRowSlotProps) => ReactNode
}

export const SafenetAuditRowView = ({
  label,
  actionType,
  iconColor,
  isVerified,
  href,
  isLast,
  timestamp,
  renderAuditRow,
}: SafenetAuditRowViewProps): ReactElement => {
  return (
    // The row appears only once the chain read resolves; the entrance animation softens the late insert.
    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
      {renderAuditRow({
        label,
        actionType,
        iconColor,
        actor:
          // Theme-default link color, matching the sibling rows.
          isVerified ? (
            <ExternalLink data-testid="safenet-attestation-link" href={href} noIcon>
              Safenet
            </ExternalLink>
          ) : (
            'Safenet'
          ),
        isLast,
        timestamp,
      })}
    </div>
  )
}
