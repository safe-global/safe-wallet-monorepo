import { gql, useLazyQuery } from '@apollo/client'
import { useState, useEffect } from 'react'

type Address = string

const GET_USER_POSITION = gql`
  query GetHigherRankedUsers($points: Int!, $skip: Int!) {
    superChainSmartAccounts(
      where: { points_gt: $points }
      orderBy: points
      orderDirection: desc
      first: 1000
      skip: $skip
    ) {
      id
      points
    }
  }
`

export const useUserRank = (userAddress: Address, loadingFirstFetch: boolean, userPoints?: string) => {
  const [rank, setRank] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<any>(null)

  const [fetchUserRank] = useLazyQuery(GET_USER_POSITION)

  const getUserRank = async (skip = 0, totalRank = 0): Promise<number> => {
    if (!userAddress) return totalRank

    const { data, error } = await fetchUserRank({
      variables: {
        points: userPoints && loadingFirstFetch ? parseInt(userPoints) : 0,
        skip,
      },
    })

    if (error) {
      setError(error)
      console.error('Error fetching user rank:', error)
      return totalRank
    }

    if (!data) {
      return totalRank
    }

    const users = data.superChainSmartAccounts

    // Verificar si el usuario está en la lista actual
    const userIndex = users.findIndex((user: { id: string }) => user.id.toLowerCase() === userAddress.toLowerCase())

    if (userIndex !== -1) {
      // Si encontramos al usuario, devolvemos su posición
      return totalRank + userIndex + 1
    }

    // Si obtenemos menos de 1000 usuarios, sabemos que hemos llegado al final.
    if (users.length < 1000) {
      return totalRank + users.length + 1
    }

    // Si obtenemos exactamente 1000 usuarios, debemos continuar la búsqueda.
    return getUserRank(skip + 1000, totalRank + 1000)
  }

  useEffect(() => {
    const fetchRank = async () => {
      setLoading(true)
      const userRank = await getUserRank()
      setRank(userRank)
      setLoading(false)
    }

    fetchRank()
  }, [userAddress, userPoints])

  return { rank, loading, error }
}
