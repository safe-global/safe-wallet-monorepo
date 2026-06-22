export interface RenameTarget {
  address: string
  chainIds: string[]
  currentName: string
  isSpaceSafe: boolean
  spaceId: string | null
}

// What a row/menu provides on click; the consumer augments it with isSpaceSafe + spaceId.
export type RenameClickTarget = Pick<RenameTarget, 'address' | 'chainIds' | 'currentName'>
