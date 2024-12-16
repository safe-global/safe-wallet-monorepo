import { useQuery, gql } from '@apollo/client'
import { ZeroAddress } from 'ethers'
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
    skip: !safeAddress || safeAddress === ZeroAddress,
  })
}

export default usePopulatedEOASRequest
