import type { ReactElement, ReactNode } from 'react'
import { HardDrive } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type RecipientOptionViewProps = {
  name: string
  address: string
  prefix?: string
  isSmallScreen: boolean
  avatar: ReactNode
  provenance?: { text: string; actor?: string }
  isLocal: boolean
  /** Whether the creator of a shared contact is known and gets an avatar. */
  showCreator: boolean
  memberName?: string
  /** Fallback creator avatar when no member name is known; null when the creator is not an address. */
  creatorIdenticon: ReactNode
  relativeTime?: string
  exactTime?: string
}

export const RecipientOptionView = ({
  name,
  address,
  prefix,
  isSmallScreen,
  avatar,
  provenance,
  isLocal,
  showCreator,
  memberName,
  creatorIdenticon,
  relativeTime,
  exactTime,
}: RecipientOptionViewProps): ReactElement => {
  return (
    <div className={css.option}>
      {avatar}

      <div className={css.optionMain}>
        <Typography variant="paragraph-small-bold" className={css.optionName}>
          {name}
        </Typography>

        {/* The tooltip is only needed when the address is shortened — on large screens it is fully visible */}
        <Tooltip>
          <TooltipTrigger render={<div />}>
            <Typography variant="paragraph-mini" as="div" className={css.optionAddress}>
              {prefix ? <b>{prefix}:</b> : null}
              {/* Bold the first 4 and last 4 hex chars. On narrow viewports the middle
                  collapses to an ellipsis; on wide ones the full address is shown. */}
              {address.slice(0, 2)}
              <b>{address.slice(2, 6)}</b>
              {isSmallScreen ? '…' : address.slice(6, -4)}
              <b>{address.slice(-4)}</b>
            </Typography>
          </TooltipTrigger>
          {isSmallScreen && <TooltipContent>{address}</TooltipContent>}
        </Tooltip>

        {provenance && (
          <Typography variant="paragraph-mini" as="div" color="muted" className={css.provenance}>
            {isLocal && <HardDrive size={12} className={css.provenanceIcon} />}
            {showCreator &&
              (memberName ? <InitialsAvatar name={memberName} size="xxsmall" rounded /> : creatorIdenticon)}
            <span>{provenance.text}</span>
            {provenance.actor && (
              /* Pill styling is a spoofing defense: user-provided names render in a
                 visual container that typed text cannot reproduce */
              <span className={`${css.provenanceActor} ${css.nameBadge}`}>{provenance.actor}</span>
            )}
            {relativeTime && (
              <>
                <span>·</span>
                <Tooltip>
                  <TooltipTrigger render={<span className={css.relativeTime}>{relativeTime}</span>} />
                  <TooltipContent>{exactTime}</TooltipContent>
                </Tooltip>
              </>
            )}
          </Typography>
        )}
      </div>
    </div>
  )
}
