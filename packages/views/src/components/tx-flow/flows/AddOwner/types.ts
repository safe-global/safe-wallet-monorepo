type Owner = {
  address: string
  name?: string
}

export type AddOwnerFlowProps = {
  newOwner: Owner
  removedOwner?: Owner
  threshold: number
}

export type ReplaceOwnerFlowProps = {
  newOwner: Owner
  removedOwner: Owner
  threshold: number
}
