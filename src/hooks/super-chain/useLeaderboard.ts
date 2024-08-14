import { gql, useQuery } from '@apollo/client'
import React from 'react'
import { Address } from 'viem'

export type Leaderboard = {
  superChainSmartAccounts: {
    points: number
    level: number
    superChainId: string
    badges: {
      id: string
    }[]
    noun_body: number
    noun_head: number
    noun_glasses: number
    noun_accessory: number
    noun_background: number
  }[]
  superChainSmartAccount: {
    points: number
    level: number
    superChainId: string
    badges: {
      id: string
    }[]
    noun_body: number
    noun_head: number
    noun_glasses: number
    noun_accessory: number
    noun_background: number
  }
}

function useLeaderboard(user: Address) {
  const GET_LEADERBOARD = gql`
    query GetLeaderboard($userId: String) {
      superChainSmartAccounts(first: 10, orderBy: superChainId, orderDirection: desc) {
        points
        level
        superChainId
        badges {
          id
        }
        noun_body
        noun_head
        noun_glasses
        noun_accessory
        noun_background
      }
      superChainSmartAccount(id: $userId) {
        points
        id
        level
        superChainId
        badges {
          id
        }
        noun_body
        noun_head
        noun_glasses
        noun_accessory
        noun_background
      }
    }
  `

  return useQuery<Leaderboard>(GET_LEADERBOARD, {
    variables: {
      userId: user,
    },
    pollInterval: 10000,
  })
}

export default useLeaderboard
