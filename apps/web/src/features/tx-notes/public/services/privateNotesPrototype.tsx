import { createContext, useContext, type ReactElement, type ReactNode } from 'react'

/**
 * Prototype only. Stands in for the Workspace notes API, the sign-in state and the plan check, so each story can
 * show one state. Nothing here is saved or sent anywhere.
 */

export type PrivateNoteData = {
  text: string
  /** The Workspace member who wrote it, by display name */
  author: string
  createdAt: number
}

/** A note the Workspace can no longer read: its plan ended, the note is kept */
export const HIDDEN_NOTE = 'hidden'

export type PrivateNoteEntry = PrivateNoteData | typeof HIDDEN_NOTE

/**
 * What the proposer can do with the note field:
 * - `ready`: signed in to a Workspace on Pro
 * - `signedOut`: the Safe is in a Workspace on Pro, the wallet is connected, the user is not signed in
 * - `lockedPlan`: the Workspace's plan has no private notes
 * - `noWorkspace`: the Safe is in no Workspace
 */
export type PrivateNoteAccess = 'ready' | 'signedOut' | 'lockedPlan' | 'noWorkspace'

export type PrivateNotesPrototype = {
  access: PrivateNoteAccess
  workspaceName: string
  planName: string
  /** Signers of the Safe who are not members of the Workspace, and so never see the note */
  outsideSigners: number
  /** Notes by transaction id */
  notes: Record<string, PrivateNoteEntry>
}

const DEFAULTS: PrivateNotesPrototype = {
  access: 'ready',
  workspaceName: 'Northwind Treasury',
  planName: 'Free',
  outsideSigners: 0,
  notes: {},
}

const PrivateNotesPrototypeContext = createContext<PrivateNotesPrototype>(DEFAULTS)

export const PrivateNotesPrototypeProvider = ({
  value,
  children,
}: {
  value: Partial<PrivateNotesPrototype>
  children: ReactNode
}): ReactElement => (
  <PrivateNotesPrototypeContext.Provider value={{ ...DEFAULTS, ...value }}>
    {children}
  </PrivateNotesPrototypeContext.Provider>
)

export const usePrivateNotesPrototype = (): PrivateNotesPrototype => useContext(PrivateNotesPrototypeContext)

export const usePrivateNote = (txId: string | undefined): PrivateNoteEntry | undefined => {
  const { notes } = usePrivateNotesPrototype()
  return txId ? notes[txId] : undefined
}
