export type PrivateKeyStorageOptions = {
  requireAuthentication?: boolean
}

export interface IKeyStorageService {
  storePrivateKey(userId: string, privateKey: string, options?: PrivateKeyStorageOptions): Promise<void>
  getPrivateKey(userId: string, options?: PrivateKeyStorageOptions): Promise<string | undefined>
}
