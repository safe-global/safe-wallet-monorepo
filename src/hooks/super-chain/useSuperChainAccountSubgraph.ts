import { gql, useQuery } from '@apollo/client'
import { Address } from 'viem'

type User = {
  superChainSmartAccount: {
    id: string
    points: string
    noun_body: string
    noun_head: string
    noun_glasses: string
    noun_accessory: string
    noun_background: string
    superChainId: string
  }
}
const GET_USER = gql`
  query GetUser($userAddress: Bytes!) {
    superChainSmartAccount(id: $userAddress) {
      id
      points
      noun_body
      noun_head
      noun_glasses
      noun_accessory
      noun_background
      superChainId
    }
  }
`

export const useSuperChainAccountSubgraph = (userAddress: Address | null) => {
  return useQuery<User>(GET_USER, {
    variables: {
      userAddress,
    },
    skip: !userAddress,
  })
}
