// Todo: replace with type from rtk query
export type CGWAddressbookEntry = {
  id: string
  name: string
  address: string
  chainId?: string
}

export type SpaceAddressBookEntry = {
  address: string
  name: string
  networks: {
    chainId: string
    name: string
    id: string
  }[]
}
