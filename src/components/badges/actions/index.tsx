import { Box, Button, Grid, InputAdornment, MenuItem, Select, SvgIcon, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'

import SearchIcon from '@/public/images/common/search.svg'
import History from '@/public/images/common/history.svg'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useSafeInfo from '@/hooks/useSafeInfo'
import badgesService from '@/features/superChain/services/badges.service'
import type { Address } from 'viem'
import ClaimModal from '../modals/ClaimModal'
import LevelUpModal from '../modals/LevelUpModal'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import LoadingModal from '@/components/common/LoadingModal'
import Image from 'next/image'
import FailedTxnModal from '@/components/common/ErrorModal'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import { usePrivy } from '@privy-io/react-auth'

export type ClaimData = {
  badgeImages: string[]
  totalPoints: number
  isLevelUp: boolean
}
function BadgesActions({
  claimable,
  setFilter,
  setNetwork,
}: {
  claimable: boolean
  setFilter: (filter: string) => void
  setNetwork: (network: string) => void
}) {
  const { safeAddress } = useSafeInfo()
  const { getAccessToken } = usePrivy()
  const { data: superChainAccount } = useAppSelector(selectSuperChainAccount)

  const router = useRouter()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => {
      const jwt = await getAccessToken()
      if (!jwt) throw new Error('No JWT')
      return await badgesService.attestBadges(safeAddress as Address, jwt)
    },
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ['superChainAccount', safeAddress] })
      queryClient.refetchQueries({ queryKey: ['badges', safeAddress] })
      setClaimData(data)
      setIsClaimModalOpen(true)
    },
  })

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false)
  }

  const handleCloseLevelUpModal = () => {
    setIsLevelUpModalOpen(false)
    router.push({ pathname: AppRoutes.home, query: { safe: router.query.safe } })
  }

  const handleLevelUp = () => {
    setIsClaimModalOpen(false)
    setIsLevelUpModalOpen(true)
  }

  return (
    <>
      <ClaimModal onLevelUp={handleLevelUp} data={claimData} open={isClaimModalOpen} onClose={handleCloseClaimModal} />
      <LevelUpModal
        open={isLevelUpModalOpen}
        level={Number(superChainAccount?.level)}
        onClose={handleCloseLevelUpModal}
      />
      <LoadingModal open={isPending} title="Updating badges" />
      <FailedTxnModal open={isError} onClose={handleCloseLevelUpModal} handleRetry={() => mutate()} />
      <Grid container spacing={1} item>
        <Grid item>
          <Typography variant="h3" fontSize={16} fontWeight={600}>
            Badges
          </Typography>
        </Grid>
        <Grid container spacing={2} item>
          <Grid item xs={12} lg={7}>
            <TextField
              placeholder="Search by name or network"
              variant="filled"
              onChange={(e) => setFilter(e.target.value)}
              hiddenLabel
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Box display="flex" gap={2}>
              <Select
                fullWidth
                onChange={(e) => setNetwork(e.target.value)}
                defaultValue="all"
                placeholder="Placeholder Text"
              >
                <MenuItem value="all">
                  <strong>Select network</strong>
                </MenuItem>
                <MenuItem value="optimism">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://safe-transaction-assets.safe.global/chains/10/chain_logo.png"
                      alt="Optimism Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Optimism</strong>
                  </Box>
                </MenuItem>
                <MenuItem value="base">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png"
                      alt="Base Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Base</strong>
                  </Box>
                </MenuItem>
                <MenuItem value="mode">
                  <Box display="flex" gap={1} alignItems="center">
                    <Image
                      src="https://account.superchain.eco/chains/34443/chain_logo.svg"
                      alt="Mode Logo"
                      width={24}
                      height={24}
                      loading="lazy"
                    />
                    <strong>Mode</strong>
                  </Box>
                </MenuItem>
              </Select>
              <Button
                fullWidth
                disabled={!claimable || isPending}
                variant={isPending ? 'outlined' : 'contained'}
                color="secondary"
                onClick={() => mutate()}
                endIcon={<SvgIcon component={History} inheritViewBox color="primary" />}
              >
                {isPending ? 'Loading' : claimable ? 'Claim badges' : 'No claimable badges'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesActions
