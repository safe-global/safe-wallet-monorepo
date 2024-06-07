import { useQuery, gql } from '@apollo/client'
import type { Address } from 'viem'

export type PendingEOASRequest = {
  ownerPopulateds: {
    id: string
    safe: Address
    newOwner: Address
    superChainId: string
  }[]
}

function usePendingEOASRequests(account: Address) {
  const GET_PENDINGREQUESTS = gql`
    query GetPendingRequests($account: String) {
      ownerPopulateds(where: { newOwner_contains: $account }) {
        id
        safe
        newOwner
        superChainId
      }
    }
  `

  return useQuery<PendingEOASRequest>(GET_PENDINGREQUESTS, {
    variables: {
      account,
    },
  })
}

export default usePendingEOASRequests
