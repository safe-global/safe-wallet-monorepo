export class PrivateKeyUnavailableError extends Error {
  constructor() {
    super('Private key not found')
    this.name = 'PrivateKeyUnavailableError'
  }
}
