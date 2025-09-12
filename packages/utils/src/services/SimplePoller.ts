/**
 * Singleton service that polls until a given callback resolves
 */
export class SimplePoller {
  private static INSTANCE: SimplePoller | undefined
  private readonly timers: Record<string, ReturnType<typeof setTimeout>> = {}
  private static readonly POLL_INTERVAL = 5_000

  private constructor() {}

  static getInstance() {
    if (!SimplePoller.INSTANCE) {
      SimplePoller.INSTANCE = new SimplePoller()
    }
    return SimplePoller.INSTANCE
  }

  watch(key: string, queryFn: () => Promise<unknown>) {
    return new Promise<void>((resolve) => {
      const poll = async () => {
        try {
          await queryFn()
          this.stopWatching(key)
          resolve()
        } catch {
          this.timers[key] = setTimeout(poll, SimplePoller.POLL_INTERVAL)
        }
      }
      poll()
    })
  }

  stopWatching(key: string) {
    const timer = this.timers[key]
    if (timer) {
      clearTimeout(timer)
      delete this.timers[key]
    }
  }
}
