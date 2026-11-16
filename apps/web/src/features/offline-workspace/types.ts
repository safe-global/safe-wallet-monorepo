export type OfflineMemberRole = 'ADMIN' | 'MEMBER'

export type OfflineSafe = {
  chainId: string
  address: string
}

export type OfflineContact = {
  name: string
  address: string
  chainIds: string[]
  createdAt: string
  updatedAt: string
}

export type OfflineMember = {
  id: number
  name: string
  alias: string | null
  role: OfflineMemberRole
  address: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

export type OfflineWorkspace = {
  uuid: string
  name: string
  createdAt: string
  updatedAt: string
  safes: OfflineSafe[]
  addressBook: OfflineContact[]
  members: OfflineMember[]
}

export type OfflineWorkspaceFile = {
  version: 1
  exportedAt: string
  workspace: OfflineWorkspace
}
