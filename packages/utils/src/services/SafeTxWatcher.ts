/**
 * Singleton service that polls the CGW until a transaction is indexed.
 */
export class SafeTxWatcher {
  private static INSTANCE: SafeTxWatcher | undefined
  private readonly timers: Record<string, ReturnType<typeof setTimeout>> = {}
  private static readonly POLL_INTERVAL = 5_000

  private constructor() {}

  static getInstance() {
    if (!SafeTxWatcher.INSTANCE) {
      SafeTxWatcher.INSTANCE = new SafeTxWatcher()
    }
    return SafeTxWatcher.INSTANCE
  }

  watchTx(txId: string, queryFn: () => Promise<unknown>) {
    return new Promise<void>((resolve) => {
      const poll = async () => {
        try {
          await queryFn()
          this.stopWatchingTx(txId)
          resolve()
        } catch {
          this.timers[txId] = setTimeout(poll, SafeTxWatcher.POLL_INTERVAL)
        }
      }
      poll()
    })
  }

  stopWatchingTx(txId: string) {
    const timer = this.timers[txId]
    if (timer) {
      clearTimeout(timer)
      delete this.timers[txId]
    }
  }
}
