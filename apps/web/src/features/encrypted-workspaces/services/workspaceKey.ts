import Router from 'next/router'
import type { FetchArgs } from '@reduxjs/toolkit/query'
import { setTransformRequestHook, setTransformResponseHook } from '@safe-global/store/gateway/cgwClient'
import { decryptName, encryptName, isEncryptedName } from './nameCipher'

const FRAGMENT_PARAM = 'ek'
const KEY_BYTES = 32

// The Workspace name stays plaintext; it is set on /v1/spaces/{id}, which this does not match.
const ENCRYPTED_PATH = /^\/v1\/spaces\/([^/?]+)\/(members|address-book|safes)(\/|\?|$)/

// Maximum length CGW accepts for each field, in code points.
const MAX_LENGTH_BY_FIELD: Record<string, number> = { name: 50, alias: 30 }

type WorkspaceKey = { spaceId: string; secret: string; cryptoKey: Promise<CryptoKey> }

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

const readKeyFromUrl = (): WorkspaceKey | undefined => {
  const value = new URLSearchParams(window.location.hash.replace(/^#/, '')).get(FRAGMENT_PARAM)
  const [spaceId, secret] = value?.split('.') ?? []
  const raw = secret ? fromBase64Url(secret) : undefined

  if (!spaceId || !secret || raw?.length !== KEY_BYTES) return undefined

  return {
    spaceId,
    secret,
    cryptoKey: crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']),
  }
}

// The key is read once, on page load: trackers start on page load too, so lockdown cannot begin later.
const getActiveKey = (): WorkspaceKey | undefined => {
  if (typeof window === 'undefined') return undefined
  if (activeKey === null) activeKey = readKeyFromUrl()
  return activeKey
}

export const isLockdown = (): boolean => getActiveKey() !== undefined

type MapString = (text: string, field: string) => Promise<string>

const mapStrings = async (value: unknown, map: MapString, field = ''): Promise<unknown> => {
  if (typeof value === 'string') return map(value, field)
  if (Array.isArray(value)) return Promise.all(value.map((item) => mapStrings(item, map, field)))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, item]) => [key, await mapStrings(item, map, key)] as const),
    )
    return Object.fromEntries(entries)
  }
  return value
}

const encryptRequest = async (args: FetchArgs, url: string): Promise<FetchArgs> => {
  const key = getActiveKey()
  const match = url.match(ENCRYPTED_PATH)
  if (!key || !match || match[1] !== key.spaceId || args.body === undefined) return args

  const cryptoKey = await key.cryptoKey
  const body = await mapStrings(args.body, async (text, field) => {
    const maxLength = MAX_LENGTH_BY_FIELD[field]
    return maxLength && !isEncryptedName(text) ? encryptName(text, cryptoKey, maxLength) : text
  })

  return { ...args, body }
}

const decryptResponse = async (data: unknown, url: string): Promise<unknown> => {
  const key = getActiveKey()
  if (!key || !url.startsWith('/v1/spaces')) return data

  const cryptoKey = await key.cryptoKey
  return mapStrings(data, async (text) =>
    isEncryptedName(text) ? ((await decryptName(text, cryptoKey)) ?? text) : text,
  )
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
  Router.events.on('routeChangeComplete', keepKeyInUrl)
}
