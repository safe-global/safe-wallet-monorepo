import type { ReactElement } from 'react'
import { Box, Chip, SvgIcon, Tooltip, Typography } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import {
  formatExactTime,
  formatRelativeTime,
  getProvenanceLine,
  isRecentlyAdded,
  isRecentlyChanged,
  type RecipientContact,
} from './provenance'
import css from './styles.module.css'

const RecipientOption = ({ contact, prefix }: { contact: RecipientContact; prefix?: string }): ReactElement => {
  const recentlyChanged = isRecentlyChanged(contact)
  const recentlyAdded = !recentlyChanged && isRecentlyAdded(contact)
  const provenance = getProvenanceLine(contact)
  const relativeTime = provenance?.timestamp ? formatRelativeTime(provenance.timestamp) : undefined
  const exactTime = provenance?.timestamp ? formatExactTime(provenance.timestamp) : undefined

  return (
    <Box className={css.option}>
      <Identicon address={contact.address} size={40} />

      <Box className={css.optionMain}>
        <Box className={css.nameLine}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {contact.name}
          </Typography>

          {recentlyChanged && (
            <Chip
              className={css.stateBadge}
              size="small"
              icon={<SvgIcon component={EditOutlinedIcon} inheritViewBox />}
              label="Address changed"
            />
          )}
          {recentlyAdded && <Chip className={css.stateBadge} size="small" label="New" />}
        </Box>

        <Tooltip title={contact.address} placement="top">
          <Typography variant="caption" component="span" className={css.optionAddress}>
            {prefix ? <b>{prefix}:</b> : null}
            {shortenAddress(contact.address)}
          </Typography>
        </Tooltip>

        {provenance && (
          <Typography variant="caption" component="div" color="text.secondary" className={css.provenance}>
            {contact.source === ContactSource.local && (
              <SvgIcon component={ComputerOutlinedIcon} inheritViewBox className={css.provenanceIcon} />
            )}
            <span>{provenance.text}</span>
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
