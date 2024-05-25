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

export type ClaimData = {
  claimedBadges: string[]
  totalPoints: number
  isLevelUp: boolean
}
function BadgesActions({ claimable }: { claimable: boolean }) {
  const { safeAddress } = useSafeInfo()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async () => await badgesService.attestBadges(safeAddress as Address),
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
  }

  return (
    <>
      <ClaimModal data={claimData} open={isClaimModalOpen} onClose={handleCloseClaimModal} />
      <LevelUpModal open={isLevelUpModalOpen} onClose={handleCloseLevelUpModal} />
      <Grid container spacing={1} item>
        <Grid item>
          <Typography variant="h3" fontSize={16} fontWeight={600}>
            Badges
          </Typography>
        </Grid>
        <Grid container spacing={2} item>
          <Grid item xs={7}>
            <TextField
              placeholder="Search by name or network"
              variant="filled"
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
          <Grid item xs={5}>
            <Box display="flex" gap={2}>
              <Select fullWidth renderValue={() => 'Select network'}>
                <MenuItem value="eth">Ethereum</MenuItem>
              </Select>
              <Button
                fullWidth
                disabled={!claimable || isPending}
                variant={isPending ? 'outlined' : 'contained'}
                color="secondary"
                onClick={() => mutate()}
                endIcon={<SvgIcon component={History} inheritViewBox color="primary" />}
              >
                {isPending ? 'Loading' : 'Update badges'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default BadgesActions
