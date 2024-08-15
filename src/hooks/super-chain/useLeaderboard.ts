import { gql, useLazyQuery, useQuery } from '@apollo/client'
import { Address } from 'viem'

export type Leaderboard = {
  superChainSmartAccounts: {
    points: string
    level: string
    safe: string
    superChainId: string
    badges: {
      id: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }[]
  superChainSmartAccount: {
    points: string
    level: string
    superChainId: string
    badges: {
      id: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }
}

function useLeaderboard(user: Address) {
  const GET_LEADERBOARD = gql`
    query GetLeaderboard($userId: String) {
      superChainSmartAccounts(first: 10, orderBy: points, orderDirection: desc) {
        points
        safe
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
