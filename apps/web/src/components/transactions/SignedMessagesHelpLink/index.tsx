import { Box, SvgIcon, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { useAppSelector } from '@/store'
import { selectSafeMessages } from '@/store/safeMessagesSlice'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const SignedMessagesHelpLink = () => {
  const safeMessages = useAppSelector(selectSafeMessages)
  const safeMessagesCount = safeMessages.data?.results.length ?? 0

  if (safeMessagesCount === 0) {
    return null
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <SvgIcon component={InfoIcon} inheritViewBox color="border" fontSize="small" />
      <ExternalLink noIcon href={HelpCenterArticle.SIGNED_MESSAGES}>
        <Typography variant="body2" fontWeight={700}>
          What are signed messages?
        </Typography>
      </ExternalLink>
    </Box>
  )
}

export default SignedMessagesHelpLink
