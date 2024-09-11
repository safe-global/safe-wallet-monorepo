import { Box, Divider, IconButton, Skeleton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { ResponseBadge, UserResponse } from '@/types/super-chain'
import Link from 'next/link'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Share from '@/public/images/common/share.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import NounsAvatar from '@/components/common/NounsAvatar'
import ExplorerButton from '@/components/common/ExplorerButton'
import { getBlockExplorerLink } from '@/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'

function UserInfo({
  context,
  isLoading,
  handleClose,
}: {
  context?: UserResponse
  isLoading: boolean
  handleClose: () => void
}) {
  const chain = useCurrentChain()
  const blockExplorerLink =
    chain && context ? getBlockExplorerLink(chain, context.superchainsmartaccount[0]) : undefined

  const nounSeed = useMemo(() => {
    if (!context || isLoading) return null
    return {
      background: parseInt(context!.superchainsmartaccount[4][0]),
      body: parseInt(context!.superchainsmartaccount[4][1]),
      accessory: parseInt(context!.superchainsmartaccount[4][2]),
      head: parseInt(context!.superchainsmartaccount[4][3]),
      glasses: parseInt(context!.superchainsmartaccount[4][4]),
    }
  }, [context])

  return (
    <Stack padding="24px" justifyContent="flex-start" alignItems="center" spacing={2} className={css.drawer}>
      {isLoading || !context ? (
        <>
          <Box display="flex" justifyContent="center" width="100%" position="relative" marginTop="24px !important">
            <Box display="flex" gap={1} position="absolute" color="grayText" top="-5%" right="-5%">
              <ExplorerButton {...blockExplorerLink} color="inherit" />
              <IconButton onClick={() => handleClose()}>
                <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
              </IconButton>
            </Box>
            <Box
              borderRadius="6px"
              display="flex"
              width="120px"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              border={2}
              borderColor="secondary.main"
            >
              <Skeleton variant="rectangular" width={120} height={120} />
              <Box width="100%" padding="12px" display="flex" justifyContent="center" bgcolor="secondary.main">
                <Skeleton variant="text">
                  <Typography textAlign="center" color="white">
                    Level: <strong>4</strong>
                  </Typography>
                </Skeleton>
              </Box>
            </Box>
          </Box>
          <Skeleton variant="text">
            <Typography display="flex" alignItems="center" fontWeight={600} fontSize={20}>
              potatohead
              <Typography component="span" fontSize="inherit" fontWeight="inherit" color="secondary.main">
                .superchain
              </Typography>
            </Typography>
          </Skeleton>
          <Skeleton variant="rounded" width={100} height={40} />
          <Box
            display="flex"
            paddingTop={2}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap="20px"
          >
            <Skeleton variant="text" width={100} height={30} />
            <Box display="flex" gap="12px">
              {Array.from(new Array(3)).map((_, index) => (
                <Skeleton key={index} variant="circular" width={60} height={60} />
              ))}
            </Box>
          </Box>
        </>
      ) : (
        <>
          <Box display="flex" justifyContent="center" width="100%" position="relative" marginTop="24px !important">
            <Box display="flex" gap={1} position="absolute" color="grayText" top="-5%" right="-5%">
              <ExplorerButton {...blockExplorerLink} color="inherit" />
              <IconButton onClick={() => handleClose()}>
                <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
              </IconButton>
            </Box>
            <Box
              borderRadius="6px"
              display="flex"
              width="120px"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              border={2}
              borderColor="secondary.main"
            >
              <NounsAvatar seed={nounSeed!} className={css.avatar} />

              <Box width="100%" padding="12px" bgcolor="secondary.main">
                <Typography textAlign="center" color="white">
                  Level: <strong>{parseInt(context?.superchainsmartaccount[3])}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>
          <Typography display="flex" alignItems="center" fontWeight={600} fontSize={20}>
            {context?.superchainsmartaccount[1].split('.superchain')[0]}
            <Typography component="span" fontSize="inherit" fontWeight="inherit" color="secondary.main">
              .superchain
            </Typography>
          </Typography>
          <Box
            display="flex"
            gap={1}
            justifyContent="center"
            alignItems="center"
            padding="8px 14px"
            borderRadius="6px"
            bgcolor="#ECF0F7"
          >
            <strong>{context?.superchainsmartaccount[2]}</strong>
            <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
          </Box>
          <Box
            display="flex"
            paddingTop={2}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap="20px"
          >
            <Typography fontWeight={600} fontSize={20}>
              Badges ({context?.badges.reduce((acc, badge) => acc + parseInt(badge.tier), 0)})
            </Typography>
            <Box display="flex" gap="12px">
              {context?.badges.map((badge, key) => (
                <Tooltip
                  arrow
                  key={key}
                  title={
                    <Box
                      display="flex"
                      gap="6px"
                      padding="12px"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Typography fontSize={14} textAlign="center" fontWeight={400}>
                        {badge.badge.metadata.condition.replace(
                          '{{variable}}',
                          badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata.minValue.toString(),
                        )}
                      </Typography>
                      <Box justifyContent="center" alignItems="center" display="flex" gap={1}>
                        <strong>{badge.badge.badgeTiers[parseInt(badge.tier) - 1].points}</strong>
                        <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
                      </Box>
                    </Box>
                  }
                >
                  <img
                    style={{
                      height: 60,
                      width: 60,
                    }}
                    src={badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata['2DImage']}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Stack>
  )
}

export default UserInfo
