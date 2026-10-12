export type SafeItem = {
  chainId: string
  address: string
  isReadOnly: boolean
  isPinned: boolean
  lastVisited: number
  name: string | undefined
}

export type MultiChainSafeItem = {
  address: string
  safes: SafeItem[]
  isPinned: boolean
  lastVisited: number
  name: string | undefined
}
