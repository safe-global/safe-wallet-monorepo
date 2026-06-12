import { Tooltip, SvgIcon } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const HelpTooltip = () => (
  <Tooltip
    title={
      <>
        Always verify transaction details.{' '}
        <ExternalLink href={HelpCenterArticle.VERIFY_TX_DETAILS}>Learn more</ExternalLink>.
      </>
    }
    arrow
    placement="top"
  >
    <span>
      <SvgIcon
        component={InfoIcon}
        inheritViewBox
        color="border"
        fontSize="small"
        sx={{
          verticalAlign: 'middle',
          ml: 0.5,
          mt: '-1px',
        }}
      />
    </span>
  </Tooltip>
)

export default HelpTooltip
