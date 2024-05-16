import { Box, Button, Grid, InputAdornment, MenuItem, Select, SvgIcon, TextField, Typography } from '@mui/material'
import React from 'react'
import SearchIcon from '@/public/images/common/search.svg'
// import LoadingButton from '@mui/lab/LoadingButton'
import History from '@/public/images/common/history.svg'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useSafeInfo from '@/hooks/useSafeInfo'
import badgesService from '@/features/superChain/services/badges.service'
import type { Address } from 'viem'
function BadgesActions() {
  const { safeAddress, safe } = useSafeInfo()
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async () => await badgesService.attestBadges(safeAddress as Address),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['superChainAccount', safe.owners[0].value] })
      queryClient.refetchQueries({ queryKey: ['badges', safeAddress] })
    },
  })
  return (
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
  )
}

export default BadgesActions
