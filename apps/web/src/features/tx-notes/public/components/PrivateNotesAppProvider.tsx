import { useCallback, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import {
  HIDDEN_NOTE,
  PrivateNotesPrototypeProvider,
  type PrivateNoteAccess,
  type PrivateNoteData,
  type PrivateNoteEntry,
} from '../services/privateNotesPrototype'

const NOTES_KEY = 'privateNotesPrototype'
const SETTINGS_KEY = 'privateNotesPrototypeSettings'

const ACCESS: PrivateNoteAccess[] = ['ready', 'signedOut', 'lockedPlan', 'noWorkspace']

type Settings = { access: PrivateNoteAccess; outsideSigners: number }

const DEFAULT_SETTINGS: Settings = { access: 'ready', outsideSigners: 0 }

const readSettings = (query: Record<string, string | string[] | undefined>): Partial<Settings> => {
  const access = ACCESS.find((value) => value === query.noteAccess)
  const outsideSigners = Number(query.noteOutsideSigners)
  return {
    ...(access ? { access } : {}),
    ...(query.noteOutsideSigners !== undefined && Number.isInteger(outsideSigners) ? { outsideSigners } : {}),
  }
}

/**
 * Prototype only. Lets a note written on the Review step follow its transaction through the app, in this browser:
 * notes are kept in local storage, and `?noteAccess=` / `?noteOutsideSigners=` pick the state the note field shows.
 */
const PrivateNotesAppProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [saved, setSaved] = useLocalStorage<Record<string, PrivateNoteData>>(NOTES_KEY)
  const [settings = DEFAULT_SETTINGS, setSettings] = useLocalStorage<Settings>(SETTINGS_KEY)
  const draft = useRef('')

  const query = useRouter()?.query
  const fromUrl = JSON.stringify(readSettings(query ?? {}))
  useEffect(() => {
    const changes: Partial<Settings> = JSON.parse(fromUrl)
    if (Object.keys(changes).length > 0) setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...changes }))
  }, [fromUrl, setSettings])

  const setDraft = useCallback((text: string) => {
    draft.current = text
  }, [])

  const commitDraft = useCallback(
    (txId: string) => {
      const text = draft.current.trim()
      draft.current = ''
      if (!text) return
      setSaved((prev) => ({ ...prev, [txId]: { text, author: 'You', createdAt: Date.now() } }))
    },
    [setSaved],
  )

  const notes = useMemo<Record<string, PrivateNoteEntry>>(() => {
    if (!saved) return {}
    // A Workspace that lost its plan keeps its notes but cannot read them
    if (settings.access !== 'lockedPlan') return saved
    return Object.fromEntries(Object.keys(saved).map((txId) => [txId, HIDDEN_NOTE]))
  }, [saved, settings.access])

  const value = useMemo(
    () => ({ ...settings, workspaceName: 'your Workspace', notes, setDraft, commitDraft }),
    [settings, notes, setDraft, commitDraft],
  )

  return <PrivateNotesPrototypeProvider value={value}>{children}</PrivateNotesPrototypeProvider>
}

export default PrivateNotesAppProvider
