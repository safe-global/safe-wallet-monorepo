export type PrivateKeyStorageOptions = {
  requireAuthentication?: boolean
}

export type PrivateKeyReadOptions = PrivateKeyStorageOptions & {
  throwIfMissing?: boolean
}

export interface IKeyStorageService {
  storePrivateKey(userId: string, privateKey: string, options?: PrivateKeyStorageOptions): Promise<void>
  getPrivateKey(userId: string, options?: PrivateKeyReadOptions): Promise<string | undefined>
  removePrivateKey(userId: string, options?: PrivateKeyStorageOptions): Promise<void>
}
