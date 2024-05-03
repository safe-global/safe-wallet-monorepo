import type { Address } from 'viem'

export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  eoas: Address[]
  noun: bigint[]
}
