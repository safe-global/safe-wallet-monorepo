import { gql, useLazyQuery, useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { Address } from 'viem'

export type Leaderboard = {
  superChainSmartAccounts: {
    points: string
    level: string
    safe: string
    superChainId: string
    badges: {
      id: string
      tier: string
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
      tier: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }
}

function getTimestampForLastWeek(): number {
  return Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 // Unix timestamp for one week ago
}

export function useLeaderboard(user: Address) {
  const GET_LEADERBOARD = gql`
    query GetLeaderboard($userId: String) {
      superChainSmartAccounts(first: 10, orderBy: points, orderDirection: desc) {
        points
        safe
        level
        superChainId
        badges {
          id
          tier
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
          tier
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

export type WeeklyLeaderboard = {
  superChainSmartAccounts: {
    points: string
    safe: string
    superChainId: string
    level: string
    badges: {
      id: string
    }[]
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
  }[]
}

export function useWeeklyLeaderboard(): { loading: boolean; error: any; leaderboard: WeeklyLeaderboard } {
  const lastWeekTimestamp = getTimestampForLastWeek()
  const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard>({ superChainSmartAccounts: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<any>(null)

  const GET_RECENT_POINTS_INCREMENTS = gql`
    query GetRecentPointsIncrements($lastWeekTimestamp: BigInt!, $skip: Int!) {
      pointsIncrementeds(
        where: { blockTimestamp_gte: $lastWeekTimestamp }
        orderBy: blockTimestamp
        orderDirection: desc
        first: 1000
        skip: $skip
      ) {
        id
        superChainSmartAccount {
          safe
          superChainId
          noun_background
          noun_body
          noun_accessory
          noun_head
          noun_glasses
          level
        }
        points
        blockTimestamp
      }
    }
  `

  const [fetchPointsIncrements, { data, fetchMore, loading: queryLoading, error: queryError }] =
    useLazyQuery(GET_RECENT_POINTS_INCREMENTS)

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      const pointsMap = new Map<string, any>()
      let skip = 0
      let hasMore = true

      while (hasMore) {
        const { data } = await fetchPointsIncrements({
          variables: {
            lastWeekTimestamp: 1722371655,
            skip,
          },
        })

        if (data) {
          data.pointsIncrementeds.forEach((event: any) => {
            const recipient = event.superChainSmartAccount.safe.toLowerCase()
            const points = parseInt(event.points, 10)

            if (pointsMap.has(recipient)) {
              pointsMap.set(recipient, {
                ...pointsMap.get(recipient),
                points: pointsMap.get(recipient).points + points,
              })
            } else {
              pointsMap.set(recipient, {
                points,
                safe: recipient,
                superChainId: event.superChainSmartAccount.superChainId,
                level: event.superChainSmartAccount.level,
                badges: [], // Asumimos que los badges no se manejan aquí
                noun_body: event.superChainSmartAccount.noun_body,
                noun_head: event.superChainSmartAccount.noun_head,
                noun_glasses: event.superChainSmartAccount.noun_glasses,
                noun_accessory: event.superChainSmartAccount.noun_accessory,
                noun_background: event.superChainSmartAccount.noun_background,
              })
            }
          })

          skip += 1000
          hasMore = data.pointsIncrementeds.length === 1000
        } else {
          hasMore = false
        }

        if (queryError) {
          setError(queryError)
          hasMore = false
        }
      }

      // Convertir el mapa a una matriz, ordenarlo por puntos, y tomar los top 10
      const sortedUsers = Array.from(pointsMap.values())
        .sort((a, b) => b.points - a.points) // Ordenar de mayor a menor
        .slice(0, 10) // Tomar los top 10

      setLeaderboard({ superChainSmartAccounts: sortedUsers })
      setLoading(false)
    }

    fetchAllData()
  }, [fetchPointsIncrements, lastWeekTimestamp, queryError])

  return { loading, error, leaderboard }
}
