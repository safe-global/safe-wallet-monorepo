export enum TaskState {
  CheckPending = 'CheckPending',
  ExecPending = 'ExecPending',
  ExecSuccess = 'ExecSuccess',
  ExecReverted = 'ExecReverted',
  WaitingForConfirmation = 'WaitingForConfirmation',
  Blacklisted = 'Blacklisted',
  Cancelled = 'Cancelled',
  NotFound = 'NotFound',
}

export type TransactionStatusResponse = {
  chainId: number
  taskId: string
  taskState: TaskState
  creationDate: string
  lastCheckDate?: string
  lastCheckMessage?: string
  transactionHash?: string
  blockNumber?: number
  executionDate?: string
}

export type RelayResponse = {
  task: TransactionStatusResponse
}

const TASK_STATUS_URL = 'https://relay.gelato.digital/tasks/status'
const WAIT_FOR_RELAY_TIMEOUT = 3 * 60_000 // 3 minutes
const POLL_INTERVAL = 5_000 // 5 seconds
export const TIMEOUT_ERROR_CODE = 'TIMEOUT'

const getTaskTrackingUrl = (taskId: string) => `${TASK_STATUS_URL}/${taskId}`

/**
 * Fetches the status of a relay transaction from Gelato
 * @param taskId - The Gelato task ID
 * @returns Promise with the transaction status response or undefined if error
 */
export const getRelayTxStatus = async (taskId: string): Promise<RelayResponse | undefined> => {
  const url = getTaskTrackingUrl(taskId)

  try {
    const response = await fetch(url).then((res) => {
      // 404s can happen if gelato is a bit slow with picking up the taskID
      if (res.status !== 404 && res.ok) {
        return res.json()
      }

      return res.json().then((data) => {
        throw new Error(`${res.status} - ${res.statusText}: ${data?.message}`)
      })
    })
    return response
  } catch (error) {
    console.error('Error fetching relay status:', error)
    return
  }
}

/**
 * Singleton class for watching relay transactions via Gelato.
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
   * Watches a relay task and polls Gelato API for status updates.
   * The promise resolves when the task is successful and returns the transaction hash.
   * The promise rejects if the task fails, is cancelled, or times out.
   *
   * @param taskId - The Gelato task ID to watch
   * @param onUpdate - Optional callback that receives status updates
   * @returns Promise that resolves with transaction hash when task completes successfully
   */
  watchTaskId(
    taskId: string,
    { onUpdate, onNextPoll }: { onUpdate?: (response: TransactionStatusResponse) => void; onNextPoll?: () => void },
  ): Promise<TransactionStatusResponse> {
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

        const response = await getRelayTxStatus(taskId)

        if (!response) {
          // Retry on error
          // Call update callback if provided

          this.timers[taskId] = setTimeout(poll, POLL_INTERVAL)

          onNextPoll?.()

          return
        }

        const { task } = response
        onUpdate?.(task)

        // Check if the task is in a terminal state
        switch (task.taskState) {
          case TaskState.ExecSuccess:
          case TaskState.WaitingForConfirmation:
            // Transaction executed successfully
            if (task.transactionHash) {
              this.stopWatchingTaskId(taskId)
              resolve(task)
              return
            }
            // Keep polling until we have the hash
            break

          case TaskState.ExecReverted:
          case TaskState.Blacklisted:
          case TaskState.Cancelled:
            // Transaction failed
            this.stopWatchingTaskId(taskId)
            reject(new Error(`Relay transaction failed: ${task.taskState}`))
            return

          case TaskState.CheckPending:
          case TaskState.ExecPending:
          case TaskState.NotFound:
            // Still processing, keep polling
            break

          default:
            // Unknown state, keep polling
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
