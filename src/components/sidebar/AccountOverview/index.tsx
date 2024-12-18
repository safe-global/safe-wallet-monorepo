import ModalDialog from '@/components/common/ModalDialog'
import NounsAvatar from '@/components/common/NounsAvatar'
import Badges from '@/components/superChain/Badges'
import Perks from '@/components/superChain/Perks'
import { BACKEND_BASE_URI } from '@/config/constants'
import useCurrentPerks from '@/hooks/super-chain/useCurrentPerks'
import { useUserRank } from '@/hooks/super-chain/useUserRank'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { UserResponse } from '@/types/super-chain'
import { Box, DialogContent, Divider, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useMemo } from 'react'
import { Address } from 'viem'

function AccountOverview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: currentPerks, isLoading: currentPerksIsLoading } = useCurrentPerks()
  const superChainSmartAccount = useAppSelector(selectSuperChainAccount)
  const safeAddress: Address = useSafeAddress() as Address

  const { rank } = useUserRank(safeAddress)

  const { data: user, isLoading: userIsLoading } = useQuery<UserResponse>({
    queryKey: ['AccountOverview'],
    queryFn: async () => {
      const response = await axios.get(`${BACKEND_BASE_URI}/user/${safeAddress}`)
      return response.data
    },
  })

  function truncateName(name: string, maxLength: number) {
    if (name.length > maxLength) {
      return `${name.substring(0, maxLength)}...`
    }
    return name
  }

  const nounSeed = useMemo(() => {
    return {
      background: Number(superChainSmartAccount.data.noun[0]),
      body: Number(superChainSmartAccount.data.noun[1]),
      accessory: Number(superChainSmartAccount.data.noun[2]),
      head: Number(superChainSmartAccount.data.noun[3]),
      glasses: Number(superChainSmartAccount.data.noun[4]),
    }
  }, [superChainSmartAccount])

  return (
    <ModalDialog
      maxWidth="xs"
      open={open}
      hideChainIndicator
      dialogTitle={
        <Typography fontSize={24} fontWeight={600}>
          Account overview
        </Typography>
      }
      onClose={onClose}
    >
      <DialogContent>
        <Box display="flex" paddingTop="24px">
          <Box
            width={120}
            position="relative"
            height={120}
            border="2px solid var(--color-secondary-main)"
            borderRadius="6px 0px 6px 6px"
            overflow="hidden"
          >
            <NounsAvatar seed={nounSeed} />
          </Box>
          <Box display="flex" flexDirection="column" justifyContent="flex-start" alignItems="flex-start">
            <Box display="flex" flexDirection="row" gap={2}>
              <Box
                display="flex"
                gap="4px"
                justifyContent="center"
                alignItems="center"
                height="34px"
                bgcolor="var(--color-secondary-main)"
                borderRadius="0px 6px 6px 0px"
                padding="12px"
                width="76px"
              >
                <Typography color="white" fontWeight={500} fontSize="14px">
                  Level: <span style={{ fontWeight: 600 }}>{Number(superChainSmartAccount.data.level)}</span>
                </Typography>
              </Box>

              <Box
                display="flex"
                gap="4px"
                justifyContent="center"
                alignItems="center"
                height="34px"
                bgcolor="gray"
                borderRadius="6px 6px 6px 6px"
                padding="12px"
                minWidth="76px"
              >
                <Typography color="white" fontWeight={500} fontSize="14px">
                  Rank: <span style={{ fontWeight: 600 }}>{rank}</span>
                </Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              padding="10px"
              gap="4px"
              justifyContent="flex-start"
              alignItems="flex-start"
            >
              <Typography
                fontWeight={600}
                color="primary"
                fontSize={16}
                whiteSpace="normal"
                display="flex"
                flexWrap="wrap"
              >
                {truncateName(superChainSmartAccount.data.superChainID.split('.superchain')[0], 12)}
                <span style={{ color: 'var(--color-secondary-main)' }}>.superchain</span>
              </Typography>
              <Box>
                <Typography fontSize={14} fontWeight={500} color="var(--color-text-secondary)">
                  SC points:{' '}
                  <span
                    style={{
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {Number(superChainSmartAccount.data.points)}
                  </span>
                </Typography>
                <Typography fontSize={14} fontWeight={500} color="var(--color-text-secondary)">
                  Points to level up:{' '}
                  <span
                    style={{
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {Number(superChainSmartAccount.data.pointsToNextLevel ?? superChainSmartAccount.data.points)}
                  </span>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <Divider />

      <DialogContent>
        <Typography fontWeight={600} fontSize={20} variant="body1">
          My Badges ({user?.badges?.length ?? 0})
        </Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="flex-start" paddingTop="20px" gap="12px">
          <Badges badges={user?.badges} isLoading={userIsLoading} />
        </Box>
      </DialogContent>
      <Divider />

      <DialogContent>
        <Typography fontWeight={600} fontSize={20} variant="body1">
          My Perks ({currentPerks?.length ?? 0})
        </Typography>
        <Perks data={currentPerks} isLoading={currentPerksIsLoading} />
      </DialogContent>
    </ModalDialog>
  )
}

export default AccountOverview
