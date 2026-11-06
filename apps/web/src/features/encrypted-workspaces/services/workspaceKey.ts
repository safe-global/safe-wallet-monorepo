import Router from 'next/router'
import type { FetchArgs } from '@reduxjs/toolkit/query'
import type {
  AddressBookItem,
  GetSpaceSafeResponse,
  SpaceSafeDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getBaseUrl, setTransformRequestHook, setTransformResponseHook } from '@safe-global/store/gateway/cgwClient'
import { decryptName, encryptName, isEncryptedEntry, isEncryptedName } from './nameCipher'
import { decryptEntry, encryptEntry, ENTRY_CHAIN_IDS, entryAddress } from './workspaceEntries'

const FRAGMENT_PARAM = 'ek'
const SESSION_STORAGE_KEY = 'SAFE_encryptedWorkspaceKey'
const KEY_BYTES = 32

// The Workspace name stays plaintext; it is set on /v1/spaces/{id}, which has no sub-path.
const SPACE_PATH = /^\/v1\/spaces\/([^/?]+)(\/[^?]*)?/

// Maximum length CGW accepts for each member field, in code points.
const MAX_LENGTH_BY_FIELD: Record<string, number> = { name: 50, alias: 30 }

type WorkspaceKeys = { cryptoKey: CryptoKey; addressKey: CryptoKey }

type WorkspaceKey = { spaceId: string; secret: string; keys: Promise<WorkspaceKeys> }

let activeKey: WorkspaceKey | undefined | null = null

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> | undefined => {
  try {
    return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0))
  } catch {
    return undefined
  }
}

export const createWorkspaceSecret = (): string => toBase64Url(crypto.getRandomValues(new Uint8Array(KEY_BYTES)))

export const buildKeyFragment = (spaceId: string, secret: string): string => `${FRAGMENT_PARAM}=${spaceId}.${secret}`

const importKeys = async (raw: Uint8Array<ArrayBuffer>): Promise<WorkspaceKeys> => {
  const base = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey'])
  const addressKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(),
      info: new TextEncoder().encode('workspace-entry-address'),
    },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  )
  const cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  return { cryptoKey, addressKey }
}

const readKeyFromUrl = (): WorkspaceKey | undefined => {
  // A redirect through another site (sign-in, checkout) comes back without the fragment, so the tab keeps a copy.
  const value =
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get(FRAGMENT_PARAM) ??
    window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  const [spaceId, secret] = value?.split('.') ?? []
  const raw = secret ? fromBase64Url(secret) : undefined

  if (!value || !spaceId || !secret || raw?.length !== KEY_BYTES) return undefined

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, value)

  return { spaceId, secret, keys: importKeys(raw) }
}

// The key is read once, on page load: trackers start on page load too, so lockdown cannot begin later.
const getActiveKey = (): WorkspaceKey | undefined => {
  if (typeof window === 'undefined') return undefined
  if (activeKey === null) activeKey = readKeyFromUrl()
  return activeKey
}

export const isLockdown = (): boolean => getActiveKey() !== undefined

const encryptMemberNames = async (value: unknown, key: CryptoKey, field = ''): Promise<unknown> => {
  const maxLength = MAX_LENGTH_BY_FIELD[field]
  if (typeof value === 'string')
    return maxLength && !isEncryptedName(value) ? encryptName(value, key, maxLength) : value
  if (Array.isArray(value)) return Promise.all(value.map((item) => encryptMemberNames(item, key, field)))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([name, item]) => [name, await encryptMemberNames(item, key, name)] as const),
    )
    return Object.fromEntries(entries)
  }
  return value
}

// Contacts and Safes are both stored as address book items: CGW sees a derived address and the encrypted entry.
const toContactItem = async (item: AddressBookItem, keys: WorkspaceKeys): Promise<AddressBookItem> => ({
  name: await encryptEntry({ kind: 'contact', ...item }, keys.cryptoKey),
  address: await entryAddress('contact', item.address, undefined, keys.addressKey),
  chainIds: ENTRY_CHAIN_IDS,
})

const toSafeItem = async (safe: SpaceSafeDto, keys: WorkspaceKeys): Promise<AddressBookItem> => ({
  name: await encryptEntry({ kind: 'safe', address: safe.address, chainIds: [safe.chainId], name: '' }, keys.cryptoKey),
  address: await entryAddress('safe', safe.address, safe.chainId, keys.addressKey),
  chainIds: ENTRY_CHAIN_IDS,
})

const withPath = (args: FetchArgs, url: string, path: string, method: string, body?: unknown): FetchArgs => ({
  ...args,
  url: `${args.url.slice(0, args.url.length - url.length)}${path}`,
  method,
  body,
})

const encryptRequest = async (args: FetchArgs, url: string): Promise<FetchArgs> => {
  const key = getActiveKey()
  const match = url.match(SPACE_PATH)
  if (!key || !match || match[1] !== key.spaceId) return args

  const keys = await key.keys
  const path = match[2] ?? ''
  const method = (args.method ?? 'GET').toUpperCase()
  const addressBookPath = `/v1/spaces/${key.spaceId}/address-book`

  if (path === '/safes' && method === 'GET') {
    return withPath(args, url, addressBookPath, 'GET')
  }

  if (path === '/safes' && method === 'POST') {
    const { safes, addressBookItems = [] } = args.body as {
      safes: SpaceSafeDto[]
      addressBookItems?: AddressBookItem[]
    }
    const items = await Promise.all([
      ...safes.map((safe) => toSafeItem(safe, keys)),
      ...addressBookItems.map((item) => toContactItem(item, keys)),
    ])
    return withPath(args, url, addressBookPath, 'PUT', { items })
  }

  if (path === '/safes' && method === 'DELETE') {
    const { safes } = args.body as { safes: SpaceSafeDto[] }
    const paths = await Promise.all(
      safes.map(
        async (safe) => `${addressBookPath}/${await entryAddress('safe', safe.address, safe.chainId, keys.addressKey)}`,
      ),
    )
    const base = args.url.slice(0, args.url.length - url.length)
    await Promise.all(
      paths.slice(1).map((extra) => fetch(`${base}${extra}`, { method: 'DELETE', credentials: 'include' })),
    )
    return withPath(args, url, paths[0], 'DELETE')
  }

  if (path === '/address-book' && method === 'PUT') {
    const { items } = args.body as { items: AddressBookItem[] }
    return { ...args, body: { items: await Promise.all(items.map((item) => toContactItem(item, keys))) } }
  }

  if (path === '/address-book/requests' && method === 'POST') {
    return { ...args, body: await toContactItem(args.body as AddressBookItem, keys) }
  }

  const contactAddress = path.match(/^\/address-book\/(0x[0-9a-fA-F]{40})$/)?.[1]
  if (contactAddress && method === 'DELETE') {
    const stored = await entryAddress('contact', contactAddress, undefined, keys.addressKey)
    return withPath(args, url, `${addressBookPath}/${stored}`, 'DELETE')
  }

  if (path.startsWith('/members') && args.body !== undefined) {
    return { ...args, body: await encryptMemberNames(args.body, keys.cryptoKey) }
  }

  return args
}

const SAFE_ENTRY = Symbol('safe entry')

const decryptValue = async (value: unknown, keys: WorkspaceKeys): Promise<unknown> => {
  if (typeof value === 'string') {
    if (isEncryptedName(value)) return (await decryptName(value, keys.cryptoKey)) ?? value
    if (!isEncryptedEntry(value)) return value
    const entry = await decryptEntry(value, keys.cryptoKey)
    return entry ? entry.name || entry.address : value
  }

  if (Array.isArray(value)) {
    const items = await Promise.all(value.map((item) => decryptValue(item, keys)))
    return items.filter((item) => item !== SAFE_ENTRY)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.name === 'string' && isEncryptedEntry(record.name) && 'address' in record) {
      const entry = await decryptEntry(record.name, keys.cryptoKey)
      if (entry?.kind === 'safe') return SAFE_ENTRY
      if (entry) return { ...record, name: entry.name, address: entry.address, chainIds: entry.chainIds }
    }
    const entries = await Promise.all(
      Object.entries(record).map(async ([name, item]) => [name, await decryptValue(item, keys)] as const),
    )
    return Object.fromEntries(entries)
  }

  return value
}

const toSpaceSafes = async (addressBook: unknown, keys: WorkspaceKeys): Promise<GetSpaceSafeResponse> => {
  const items = (addressBook as { data?: Array<{ name: string }> }).data ?? []
  const entries = await Promise.all(
    items.map((item) =>
      isEncryptedEntry(item.name) ? decryptEntry(item.name, keys.cryptoKey) : Promise.resolve(undefined),
    ),
  )
  const safes: GetSpaceSafeResponse['safes'] = {}
  for (const entry of entries) {
    if (entry?.kind !== 'safe') continue
    const [chainId] = entry.chainIds
    safes[chainId] = [...(safes[chainId] ?? []), entry.address]
  }
  return { safes }
}

const withActiveSpaceSafes = async (data: unknown, key: WorkspaceKey, keys: WorkspaceKeys): Promise<unknown> => {
  const response = await fetch(`${getBaseUrl()}/v1/spaces/${key.spaceId}/address-book`, { credentials: 'include' })
  if (!response.ok || !Array.isArray(data)) return data

  const { safes } = await toSpaceSafes(await response.json(), keys)
  return [...data.filter((space) => space.spaceUuid !== key.spaceId), { spaceUuid: key.spaceId, safes }]
}

const decryptResponse = async (data: unknown, url: string): Promise<unknown> => {
  const key = getActiveKey()
  if (!key || !url.startsWith('/v1/spaces')) return data

  const keys = await key.keys
  const match = url.match(SPACE_PATH)

  if (match?.[1] === key.spaceId && match[2] === '/safes') return toSpaceSafes(data, keys)
  if (url.split('?')[0] === '/v1/spaces/safes') return withActiveSpaceSafes(data, key, keys)

  return decryptValue(data, keys)
}

const keepKeyInUrl = () => {
  const key = getActiveKey()
  if (!key) return

  const hash = `#${buildKeyFragment(key.spaceId, key.secret)}`
  if (window.location.hash === hash) return

  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`)
}

export const initWorkspaceEncryption = (): void => {
  if (!getActiveKey()) return

  setTransformRequestHook(encryptRequest)
  setTransformResponseHook(decryptResponse)
  keepKeyInUrl()
  Router.events.on('routeChangeComplete', keepKeyInUrl)
}
