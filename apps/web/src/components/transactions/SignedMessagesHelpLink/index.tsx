import { Box, SvgIcon, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { useMessagesGetMessagesBySafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import useSafeInfo from '@/hooks/useSafeInfo'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const SignedMessagesHelpLink = () => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const { currentData: safeMessages } = useMessagesGetMessagesBySafeV1Query(
    { chainId: safe.chainId, safeAddress },
    { skip: !safeLoaded || !safe.deployed },
  )
  const safeMessagesCount = safeMessages?.results.length ?? 0

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
