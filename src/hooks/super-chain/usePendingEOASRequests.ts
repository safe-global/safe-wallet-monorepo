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
  meta: {
    count: number
  }
}

function usePendingEOASRequests(account: Address, page = 1) {
  const GET_PENDINGREQUESTS = gql`
    query GetPendingRequests($account: String) {
      ownerPopulateds(where: { newOwner_contains: $account }, first: 5, skip:  ${5 * (page - 1)}) {
        id
        newOwner
        safe
        superChainId
        superChainSmartAccount {
          noun_background
          noun_body
          noun_accessory
          noun_head
          noun_glasses
        }
    }
      meta(id: "OwnerPopulated") {
        count
      }
    }
  `

  return useQuery<PendingEOASRequest>(GET_PENDINGREQUESTS, {
    variables: {
      account,
      page,
    },
  })
}

export default usePendingEOASRequests
