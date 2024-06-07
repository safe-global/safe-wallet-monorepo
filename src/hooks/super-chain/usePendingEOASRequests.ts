import { useQuery, gql } from '@apollo/client'
import type { Address } from 'viem'

export type PendingEOASRequest = {
  ownerPopulateds: {
    id: string
    safe: Address
    newOwner: Address
    superChainId: string
    superChainSmartAccount: {
      noun_background: number
      noun_body: number
      noun_accessory: number
      noun_head: number
      noun_glasses: number
    }
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
        superChainSmartAccount {
          noun_background
          noun_body
          noun_accessory
          noun_head
          noun_glasses
        }
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
