import { BACKEND_BASE_URI } from '@/config/constants'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'

type Noun = {
  accessory: number
  background: number
  body: number
  glasses: number
  head: number
}

export type Leaderboard = {
  data: {
    level: number
    noun: string
    superChainId: string
    superaccount: string
    total_points: string
  }[]
  hasNextPage: boolean
}

export function useLeaderboard() {
  return useInfiniteQuery({
    queryKey: ['leaderboard'],
    queryFn: async ({ pageParam }) => {
      const response = await axios.get<Leaderboard>(`${BACKEND_BASE_URI}/leaderboard`, {
        params: {
          page: pageParam,
        },
      })
      return {
        data: response.data.data.map((user) => ({
          ...user,
          noun: JSON.parse(user.noun) as Noun,
        })),

        hasNextPage: response.data.hasNextPage,
        nextPage: pageParam + 1,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),
  })
}
