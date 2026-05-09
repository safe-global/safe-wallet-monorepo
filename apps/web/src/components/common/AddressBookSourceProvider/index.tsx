import { type ReactNode, createContext, useContext } from 'react'
import { type NextRouter, useRouter } from 'next/router'

export type AddressBookSource = 'merged' | 'spaceOnly' | 'localOnly'

const DEFAULT_SOURCE: AddressBookSource = 'merged'

const AddressBookSourceContext = createContext<AddressBookSource>(DEFAULT_SOURCE)

export const useAddressBookSource = () => useContext(AddressBookSourceContext)

const deriveSourceFromURL = (router: NextRouter) => {
  const { spaceId } = router.query
  const querySpaceId = Array.isArray(spaceId) ? spaceId[0] : spaceId

  return querySpaceId ? 'spaceOnly' : 'merged'
}

/**
 * This provider handles address book name sources across the app.
 * By default, it merges the space address book with the local one
 * There are exceptions to this rule:
 * -> Within a space the source should only be the space address book
 * -> Within the local address book view the source should only be the local address book
 * @param source
 * @param children
 * @constructor
 */
export const AddressBookSourceProvider = ({
  source,
  children,
}: {
  source?: AddressBookSource
  children: ReactNode
}) => {
  const router = useRouter()
  const value = source ?? deriveSourceFromURL(router)

  return <AddressBookSourceContext.Provider value={value}>{children}</AddressBookSourceContext.Provider>
}
