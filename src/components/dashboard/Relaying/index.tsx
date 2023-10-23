import { WidgetBody, WidgetContainer } from '@/components/dashboard/styled'
import { Box, Card, Divider, Skeleton, Stack, SvgIcon, Typography } from '@mui/material'
import { MAX_HOUR_RELAYS, useRelaysBySafe } from '@/hooks/useRemainingRelays'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'
import InfoIcon from '@/public/images/notifications/info.svg'
import GasStationIcon from '@/public/images/common/gas-station.svg'
import ExternalLink from '@/components/common/ExternalLink'
import classnames from 'classnames'
import css from './styles.module.css'
import { HelpCenterArticle } from '@/config/constants'
import { useCurrentChain } from '@/hooks/useChains'
import { SPONSOR_LOGOS } from '@/components/tx/SponsoredBy'

const Relaying = () => {
  const chain = useCurrentChain()
  const [relays, relaysError] = useRelaysBySafe()

  const limit = relays?.limit || MAX_HOUR_RELAYS

  return (
    <WidgetContainer>
      <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
        New in {'BNB Safe{Wallet}'}
      </Typography>

      <WidgetBody>
        <Card sx={{ padding: 4, height: 'inherit' }}>
          <Box mb={4}>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
              <Box className={css.icon}>
                <SvgIcon component={GasStationIcon} fontWeight={700} inheritViewBox />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                Gas fees sponsored by
              </Typography>
              <img src={SPONSOR_LOGOS[chain?.chainId || '']} alt={chain?.chainName} className={css.gcLogo} />
              <Typography variant="h6" fontWeight={700} flexShrink={0}>
                {chain?.chainName}
              </Typography>
            </Stack>
            <Typography variant="body2" marginRight={1} sx={{ display: 'inline' }}>
              Benefit from a gasless experience powered by Gelato and <i>Safe</i>. Experience gasless UX for the next
              month!
            </Typography>
            <Track {...OVERVIEW_EVENTS.RELAYING_HELP_ARTICLE}>
              <ExternalLink href={HelpCenterArticle.RELAYING}>Read more</ExternalLink>
            </Track>
          </Box>
          <Divider />
          <Box mt={4} display="flex" justifyContent="space-between">
            <Typography color="primary.light" alignSelf="center">
              Transactions per hour
            </Typography>
            {relays !== undefined ? (
              <Box
                className={classnames(css.relayingChip, {
                  [css.unavailable]: relays.remaining === 0,
                })}
              >
                <SvgIcon component={InfoIcon} fontSize="small" />
                {relaysError ? (
                  <Typography fontWeight={700}>{limit} per hour</Typography>
                ) : (
                  <Typography fontWeight={700}>
                    {relays.remaining} of {limit}
                  </Typography>
                )}
              </Box>
            ) : (
              <Skeleton className={css.chipSkeleton} variant="rounded" />
            )}
          </Box>
        </Card>
      </WidgetBody>
    </WidgetContainer>
  )
}

export default Relaying
