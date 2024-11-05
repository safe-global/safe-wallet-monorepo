import Leaderboard from '@/components/leaderboard'
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import UserInfo from '@/components/leaderboard/UserInfo'
import { BACKEND_BASE_URI } from '@/config/constants'
import { UserResponse } from '@/types/super-chain'

import { Box, Drawer } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Head from 'next/head'
import React, { useState } from 'react'
import { type Address, zeroAddress } from 'viem'

function LeaderboardLayout() {
  const [selectedUser, setSelectedUser] = useState<string | Address>(zeroAddress)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data, isLoading } = useQuery<UserResponse>({
    queryKey: ['leaderboard', selectedUser],
    queryFn: async () => {
      if (selectedUser === zeroAddress) {
        return null
      }
      const response = await axios.get(`${BACKEND_BASE_URI}/user/${selectedUser}`)
      return response.data
    },
    enabled: selectedUser !== zeroAddress,
  })

  const handleUserSelect = (user: string | Address) => {
    if (!isDrawerOpen) setIsDrawerOpen(true)
    setSelectedUser(user)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  return (
    <>
      <Head>
        <title>Super Account – Leaderboard</title>
      </Head>
      <Box width="100%" height="100%">
        <LeaderboardHeader />
        <Leaderboard handleUserSelect={handleUserSelect} />
        <Drawer variant="temporary" anchor="right" open={isDrawerOpen} onClose={handleDrawerClose}>
          <UserInfo context={data} isLoading={isLoading} handleClose={handleDrawerClose} />
        </Drawer>
      </Box>
    </>
  )
}

export default LeaderboardLayout
