/**
 * Relay task status codes returned by the CGW proxy for Gelato Turbo Relayer.
 *
 * The CGW proxies Gelato's JSON-RPC `relayer_getStatus` endpoint at:
 *   GET {CGW_BASE_URL}/v1/chains/{chainId}/relay/status/{taskId}
 */
export enum RelayStatus {
  /** Task is queued, not yet submitted to chain */
  Pending = 100,
  /** Task has been submitted to chain, awaiting confirmation */
  Submitted = 110,
  /** Task successfully included on-chain */
  Included = 200,
  /** Task rejected (not submitted to chain) */
  Rejected = 400,
  /** Task was included but reverted on-chain */
  Reverted = 500,
}

export interface RelayTaskReceipt {
  transactionHash: string
}

export interface RelayTaskStatus {
  status: RelayStatus
  receipt?: RelayTaskReceipt
}

const WAIT_FOR_RELAY_TIMEOUT = 3 * 60_000 // 3 minutes
const POLL_INTERVAL = 5_000 // 5 seconds
export const TIMEOUT_ERROR_CODE = 'TIMEOUT'

/**
 * Returns the CGW proxy URL for fetching relay task status.
 */
const getTaskTrackingUrl = (baseUrl: string, chainId: string, taskId: string) =>
  `${baseUrl}/v1/chains/${chainId}/relay/status/${taskId}`

/**
 * Helper to check if a relay status is a terminal (final) state.
 */
export const isTerminalRelayStatus = (status: RelayStatus): boolean => {
  return status === RelayStatus.Included || status === RelayStatus.Rejected || status === RelayStatus.Reverted
}

/**
 * Fetches the status of a relay transaction via the CGW proxy.
 *
 * @param baseUrl - CGW base URL
 * @param chainId - Chain ID where the relay transaction was submitted
 * @param taskId - The Gelato task ID
 * @returns Promise with the relay task status or undefined if error
 */
export const getRelayTxStatus = async (
  baseUrl: string,
  chainId: string,
  taskId: string,
): Promise<RelayTaskStatus | undefined> => {
  const url = getTaskTrackingUrl(baseUrl, chainId, taskId)

  try {
    const response = await fetch(url)

    if (response.ok) {
      return response.json()
    }

    const data = await response.json().catch(() => ({}))
    throw new Error(`${response.status} - ${response.statusText}: ${data?.message ?? 'Unknown error'}`)
  } catch (error) {
    console.error('Error fetching relay status:', error)
    return undefined
  }
}

/**
 * Singleton class for watching relay transactions via the CGW proxy.
 *
 * Offers methods to:
 * - {@linkplain watchTaskId} to watch a relay task until completion
 * - {@linkplain stopWatchingTaskId} to stop an active watcher for a task
 */
export class RelayTxWatcher {
  private static INSTANCE: RelayTxWatcher | undefined
  private readonly timers: Record<string, ReturnType<typeof setTimeout>> = {}
  private readonly startTimes: Record<string, number> = {}

  private constructor() {}

  static getInstance() {
    if (!RelayTxWatcher.INSTANCE) {
      RelayTxWatcher.INSTANCE = new RelayTxWatcher()
    }
    return RelayTxWatcher.INSTANCE
  }

  /**
   * Watches a relay task and polls the CGW proxy for status updates.
   * The promise resolves when the task is successful and returns the task status (including receipt).
   * The promise rejects if the task fails, is rejected, or times out.
   *
   * @param taskId - The Gelato task ID to watch
   * @param chainId - Chain ID where the relay transaction was submitted
   * @param baseUrl - CGW base URL
   * @param onUpdate - Optional callback that receives status updates
   * @returns Promise that resolves with RelayTaskStatus when task completes successfully
   */
  watchTaskId(
    taskId: string,
    chainId: string,
    baseUrl: string,
    { onUpdate, onNextPoll }: { onUpdate?: (response: RelayTaskStatus) => void; onNextPoll?: () => void },
  ): Promise<RelayTaskStatus> {
    return new Promise((resolve, reject) => {
      this.startTimes[taskId] = Date.now()

      const poll = async () => {
        // Check for timeout
        if (Date.now() - this.startTimes[taskId] > WAIT_FOR_RELAY_TIMEOUT) {
          this.stopWatchingTaskId(taskId)
          reject(
            new Error('Relay transaction timeout', {
              cause: TIMEOUT_ERROR_CODE,
            }),
          )
          return
        }

        const response = await getRelayTxStatus(baseUrl, chainId, taskId)

        if (!response) {
          // Retry on error
          this.timers[taskId] = setTimeout(poll, POLL_INTERVAL)
          onNextPoll?.()
          return
        }

        onUpdate?.(response)

        // Check if the task is in a terminal state
        switch (response.status) {
          case RelayStatus.Included:
            // Transaction included on-chain successfully
            if (response.receipt?.transactionHash) {
              this.stopWatchingTaskId(taskId)
              resolve(response)
              return
            }
            // Keep polling until we have the receipt (should not happen for status 200, but be safe)
            break

          case RelayStatus.Reverted:
            // Transaction was included but reverted
            this.stopWatchingTaskId(taskId)
            reject(new Error('Relay transaction reverted on-chain'))
            return

          case RelayStatus.Rejected:
            // Transaction was rejected (not submitted)
            this.stopWatchingTaskId(taskId)
            reject(new Error('Relay transaction was rejected by relay provider'))
            return

          case RelayStatus.Pending:
          case RelayStatus.Submitted:
            // Still processing, keep polling
            break

          default:
            // Unknown status, keep polling
            break
        }

        // Schedule next poll
        this.timers[taskId] = setTimeout(poll, POLL_INTERVAL)
      }

      // Start polling
      poll()
    })
  }

  /**
   * Stops an active watcher for the given task ID
   */
  stopWatchingTaskId(taskId: string) {
    const timer = this.timers[taskId]
    if (timer) {
      clearTimeout(timer)
      delete this.timers[taskId]
      delete this.startTimes[taskId]
    }
  }
}
