import type { ReactElement } from 'react'
import { Box, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { HardDrive } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
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
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'))
  const provenance = getProvenanceLine(contact, memberName, resolveName)
  const relativeTime = provenance?.timestamp ? formatRelativeTime(provenance.timestamp) : undefined
  const exactTime = provenance?.timestamp ? formatExactTime(provenance.timestamp) : undefined

  return (
    <Box className={css.option}>
      <Identicon address={contact.address} size={40} />

      <Box className={css.optionMain}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {contact.name}
        </Typography>

        {/* The tooltip is only needed when the address is shortened — on large screens it is fully visible */}
        <Tooltip title={isSmallScreen ? contact.address : ''} placement="top">
          <Typography variant="caption" component="div" className={css.optionAddress}>
            {prefix ? <b>{prefix}:</b> : null}
            {isSmallScreen ? (
              shortenAddress(contact.address)
            ) : (
              <>
                {contact.address.slice(0, 2)}
                <b>{contact.address.slice(2, 6)}</b>
                {contact.address.slice(6, -4)}
                <b>{contact.address.slice(-4)}</b>
              </>
            )}
          </Typography>
        </Tooltip>

        {provenance && (
          <Typography variant="caption" component="div" color="text.secondary" className={css.provenance}>
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
                <Tooltip title={exactTime} placement="top">
                  <span className={css.relativeTime}>{relativeTime}</span>
                </Tooltip>
              </>
            )}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default RecipientOption
