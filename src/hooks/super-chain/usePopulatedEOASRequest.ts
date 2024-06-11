import { useQuery, gql } from '@apollo/client'
import type { Address } from 'viem'

function usePopulatedEOASRequest(safeAddress: Address) {
  const GET_OWNERPOPULATED = gql`
    query GetOwnerPopulated($safeAddress: String) {
      ownerPopulateds(where: { safe_contains: $safeAddress }) {
        id
        safe
        newOwner
      }
    }
  `
  return useQuery(GET_OWNERPOPULATED, {
    variables: {
      safeAddress,
    },
    pollInterval: 10000,
  })
}

export default usePopulatedEOASRequest
