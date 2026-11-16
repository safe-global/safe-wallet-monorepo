import { getAddress, isAddress } from 'ethers'
import type {
  GetSpaceResponse,
  GetSpaceSafeResponse,
  MemberDto,
  SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  OfflineContact,
  OfflineMember,
  OfflineSafe,
  OfflineWorkspace,
  OfflineWorkspaceFile,
  OfflineMemberRole,
} from '../types'

export const OFFLINE_USER_ID = 1
const OFFLINE_WORKSPACE_FILE_VERSION = 1

const DEFAULT_MEMBER_NAME = 'Me'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CHAIN_ID_PATTERN = /^\d+$/
const ROLES: OfflineMemberRole[] = ['ADMIN', 'MEMBER']

type Parser<T> = (value: unknown, label: string) => T

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fail = (message: string): never => {
  throw new Error(message)
}

const parseRecord = (value: unknown, label: string): Record<string, unknown> =>
  isRecord(value) ? value : fail(`${label} must be an object`)

const parseName = (value: unknown, label: string): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fail(`${label} needs a name`)

const parseAddress = (value: unknown, label: string): string =>
  typeof value === 'string' && isAddress(value) ? getAddress(value) : fail(`${label} has an invalid address`)

const parseChainId = (value: unknown, label: string): string => {
  const chainId = String(value)
  return CHAIN_ID_PATTERN.test(chainId) ? chainId : fail(`${label} has an invalid chain ID`)
}

const parseTimestamp = (value: unknown, fallback: string): string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback

const parseList = <T>(value: unknown, label: string, parseItem: Parser<T>): T[] => {
  if (value === undefined) return []
  if (!Array.isArray(value)) return fail(`${label} must be a list`)
  return value.map((item, index) => parseItem(item, `${label}[${index}]`))
}

const parseSafe: Parser<OfflineSafe> = (value, label) => {
  const safe = parseRecord(value, label)
  return { chainId: parseChainId(safe.chainId, label), address: parseAddress(safe.address, label) }
}

const parseContact =
  (now: string): Parser<OfflineContact> =>
  (value, label) => {
    const contact = parseRecord(value, label)
    return {
      name: parseName(contact.name, label),
      address: parseAddress(contact.address, label),
      chainIds: parseList(contact.chainIds, `${label}.chainIds`, parseChainId),
      createdAt: parseTimestamp(contact.createdAt, now),
      updatedAt: parseTimestamp(contact.updatedAt, now),
    }
  }

const parseMember =
  (now: string): Parser<OfflineMember> =>
  (value, label) => {
    const member = parseRecord(value, label)
    const role = ROLES.find((candidate) => candidate === member.role)
    return {
      // 0 marks a member that gets an id assigned in normalizeMembers
      id: Number.isInteger(member.id) && Number(member.id) > 0 ? Number(member.id) : 0,
      name: parseName(member.name, label),
      alias: typeof member.alias === 'string' && member.alias.trim() ? member.alias.trim() : null,
      role: role ?? 'MEMBER',
      address: member.address == null ? null : parseAddress(member.address, label),
      email: typeof member.email === 'string' && member.email ? member.email : null,
      createdAt: parseTimestamp(member.createdAt, now),
      updatedAt: parseTimestamp(member.updatedAt, now),
    }
  }

const createSelfMember = (now: string): OfflineMember => ({
  id: OFFLINE_USER_ID,
  name: DEFAULT_MEMBER_NAME,
  alias: null,
  role: 'ADMIN',
  address: null,
  email: null,
  createdAt: now,
  updatedAt: now,
})

export const getNextMemberId = (members: OfflineMember[]): number =>
  Math.max(OFFLINE_USER_ID, ...members.map((member) => member.id)) + 1

// The local user is always member OFFLINE_USER_ID and an admin, so every view stays editable
const normalizeMembers = (members: OfflineMember[], now: string): OfflineMember[] => {
  const usedIds = new Set<number>()
  let nextId = getNextMemberId(members)
  const normalized = members.map((member) => {
    const id = member.id > 0 && !usedIds.has(member.id) ? member.id : nextId++
    usedIds.add(id)
    return { ...member, id, role: id === OFFLINE_USER_ID ? 'ADMIN' : member.role }
  })
  return usedIds.has(OFFLINE_USER_ID) ? normalized : [createSelfMember(now), ...normalized]
}

const dedupeSafes = (safes: OfflineSafe[]): OfflineSafe[] =>
  safes.filter(
    (safe, index) =>
      safes.findIndex(
        (other) => other.chainId === safe.chainId && other.address.toLowerCase() === safe.address.toLowerCase(),
      ) === index,
  )

export const createOfflineWorkspace = (name: string, now: string): OfflineWorkspace => ({
  uuid: crypto.randomUUID(),
  name,
  createdAt: now,
  updatedAt: now,
  safes: [],
  addressBook: [],
  members: [createSelfMember(now)],
})

/** Reads a Workspace file; throws an Error whose message can be shown to the user. */
export const parseWorkspaceFile = (json: string): OfflineWorkspace => {
  let file: unknown
  try {
    file = JSON.parse(json)
  } catch {
    return fail('The file is not valid JSON')
  }

  if (!isRecord(file) || file.version !== OFFLINE_WORKSPACE_FILE_VERSION || !isRecord(file.workspace)) {
    return fail(`Expected a Workspace file with "version": ${OFFLINE_WORKSPACE_FILE_VERSION} and a "workspace"`)
  }

  const { workspace } = file
  const now = new Date().toISOString()

  return {
    uuid:
      typeof workspace.uuid === 'string' && UUID_PATTERN.test(workspace.uuid) ? workspace.uuid : crypto.randomUUID(),
    name: parseName(workspace.name, 'The Workspace'),
    createdAt: parseTimestamp(workspace.createdAt, now),
    updatedAt: parseTimestamp(workspace.updatedAt, now),
    safes: dedupeSafes(parseList(workspace.safes, 'safes', parseSafe)),
    addressBook: parseList(workspace.addressBook, 'addressBook', parseContact(now)),
    members: normalizeMembers(parseList(workspace.members, 'members', parseMember(now)), now),
  }
}

/** Maps a Workspace read from CGW to the file format; the current user becomes the local user. */
export const workspaceFromApi = ({
  space,
  safes,
  contacts,
  members,
  currentUserId,
}: {
  space: GetSpaceResponse
  safes: GetSpaceSafeResponse
  contacts: SpaceAddressBookItemDto[]
  members: MemberDto[]
  currentUserId: number | undefined
}): OfflineWorkspace => {
  const now = new Date().toISOString()

  return {
    uuid: space.uuid,
    name: space.name,
    createdAt: now,
    updatedAt: now,
    safes: Object.entries(safes.safes).flatMap(([chainId, addresses]) =>
      addresses.map((address) => ({ chainId, address })),
    ),
    addressBook: contacts.map(({ name, address, chainIds, createdAt, updatedAt }) => ({
      name,
      address,
      chainIds,
      createdAt,
      updatedAt,
    })),
    members: normalizeMembers(
      members
        .filter((member) => member.status !== 'DECLINED')
        .map((member) => ({
          id: member.user.id === currentUserId ? OFFLINE_USER_ID : 0,
          name: member.name,
          alias: member.alias ?? null,
          role: member.role,
          address: member.user.address,
          email: member.user.email,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        })),
      now,
    ),
  }
}

const toWorkspaceFile = (workspace: OfflineWorkspace): OfflineWorkspaceFile => ({
  version: OFFLINE_WORKSPACE_FILE_VERSION,
  exportedAt: new Date().toISOString(),
  workspace,
})

export const downloadWorkspaceFile = (workspace: OfflineWorkspace): void => {
  const blob = new Blob([JSON.stringify(toWorkspaceFile(workspace), null, 2)], { type: 'application/json' })
  const slug = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const link = document.createElement('a')
  link.download = `safe-workspace-${slug}-${new Date().toISOString().slice(0, 10)}.json`
  link.href = URL.createObjectURL(blob)
  link.dispatchEvent(new MouseEvent('click'))
}
