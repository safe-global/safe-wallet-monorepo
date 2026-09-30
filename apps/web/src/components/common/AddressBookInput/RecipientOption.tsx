import type { ReactElement } from 'react'
import { HardDrive } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import { formatExactTime, formatRelativeTime, getProvenanceLine, type RecipientContact } from './provenance'
import css from './styles.module.css'

const RecipientOption = ({
  contact,
  prefix,
  memberName,
  resolveName,
}: {
  contact: RecipientContact
  prefix?: string
  memberName?: string
  resolveName?: (address: string) => string
}): ReactElement => {
  const isSmallScreen = useMediaQuery('(max-width:1199.95px)')
  const provenance = getProvenanceLine(contact, memberName, resolveName)
  const relativeTime = provenance?.timestamp ? formatRelativeTime(provenance.timestamp) : undefined
  const exactTime = provenance?.timestamp ? formatExactTime(provenance.timestamp) : undefined

  return (
    <div className={css.option}>
      <Identicon address={contact.address} size={40} />

      <div className={css.optionMain}>
        <Typography variant="paragraph-small-bold" className={css.optionName}>
          {contact.name}
        </Typography>

        {/* The tooltip is only needed when the address is shortened — on large screens it is fully visible */}
        <Tooltip>
          <TooltipTrigger render={<div />}>
            <Typography variant="paragraph-mini" as="div" className={css.optionAddress}>
              {prefix ? <b>{prefix}:</b> : null}
              {/* Bold the first 4 and last 4 hex chars. On narrow viewports the middle
                  collapses to an ellipsis; on wide ones the full address is shown. */}
              {contact.address.slice(0, 2)}
              <b>{contact.address.slice(2, 6)}</b>
              {isSmallScreen ? '…' : contact.address.slice(6, -4)}
              <b>{contact.address.slice(-4)}</b>
            </Typography>
          </TooltipTrigger>
          {isSmallScreen && <TooltipContent>{contact.address}</TooltipContent>}
        </Tooltip>

        {provenance && (
          <Typography variant="paragraph-mini" as="div" color="muted" className={css.provenance}>
            {contact.source === ContactSource.local && <HardDrive size={12} className={css.provenanceIcon} />}
            {contact.source !== ContactSource.local &&
              contact.createdBy &&
              (memberName ? (
                <InitialsAvatar name={memberName} size="xxsmall" rounded />
              ) : isValidAddress(contact.createdBy) ? (
                <Identicon address={contact.createdBy} size={16} />
              ) : null)}
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

export default RecipientOption
