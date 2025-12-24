import { useSyncExternalStore } from 'react'

type Listener = () => void
type Undefinable<T> = T | undefined

export type LazyStoreState<T> =
  | { status: 'idle'; value: undefined; error: undefined }
  | { status: 'loading'; value: undefined; error: undefined }
  | { status: 'success'; value: T; error: undefined }
  | { status: 'error'; value: undefined; error: Error }

type Initializer<T, Args extends unknown[]> = (...args: Args) => Promise<T>

/**
 * LazyExternalStore - Singleton store with lazy initialization
 *
 * Similar to ExternalStore but supports async initialization on first access.
 * Features:
 * - Lazy initialization (only runs when first needed)
 * - Loading and error states
 * - Deduplication of concurrent initialization requests
 * - AbortController support for canceling stale initializations
 * - React hook that triggers re-renders on state changes
 */
class LazyExternalStore<T extends unknown, Args extends unknown[] = []> {
  private state: LazyStoreState<T> = { status: 'idle', value: undefined, error: undefined }
  private listeners: Set<Listener> = new Set()
  private initializer: Initializer<T, Args>
  private initializationPromise: Promise<T> | null = null
  private abortController: AbortController | null = null

  constructor(initializer: Initializer<T, Args>) {
    this.initializer = initializer
  }

  /**
   * Get the current state (value, loading, error)
   */
  public readonly getState = (): LazyStoreState<T> => {
    return this.state
  }

  /**
   * Get the current value (undefined if not initialized)
   */
  public readonly getStore = (): T | undefined => {
    return this.state.value
  }

  /**
   * Initialize the store with the given arguments
   * Deduplicates concurrent calls - returns the same promise if already initializing
   */
  public readonly initialize = async (...args: Args): Promise<T> => {
    // If already initialized successfully, return cached value
    if (this.state.status === 'success') {
      return this.state.value
    }

    // If currently initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Cancel any previous initialization
    if (this.abortController) {
      this.abortController.abort()
    }

    // Create new abort controller for this initialization
    this.abortController = new AbortController()
    const currentAbortController = this.abortController

    // Set loading state
    this.setState({ status: 'loading', value: undefined, error: undefined })

    // Create and cache the initialization promise
    this.initializationPromise = (async () => {
      try {
        const value = await this.initializer(...args)

        // Check if this initialization was aborted (e.g., due to React re-render or reset)
        if (currentAbortController.signal.aborted) {
          console.warn('LazyExternalStore: Initialization aborted, likely due to component re-render or store reset')
          // Throw to signal incompletion without setting error state (caught below)
          throw new Error('Initialization aborted')
        }

        this.setState({ status: 'success', value, error: undefined })
        return value
      } catch (error) {
        // Don't set error state if aborted (another init is in progress)
        if (!currentAbortController.signal.aborted) {
          this.setState({
            status: 'error',
            value: undefined,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
        throw error
      } finally {
        // Clear the promise and abort controller when done
        if (this.initializationPromise && !currentAbortController.signal.aborted) {
          this.initializationPromise = null
          this.abortController = null
        }
      }
    })()

    return this.initializationPromise
  }

  /**
   * Manually set the store value (bypasses lazy initialization)
   */
  public readonly setStore = (value: Undefinable<T>): void => {
    // Cancel any in-progress initialization
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.initializationPromise = null

    if (value === undefined) {
      this.setState({ status: 'idle', value: undefined, error: undefined })
    } else {
      this.setState({ status: 'success', value, error: undefined })
    }
  }

  /**
   * Reset to uninitialized state
   */
  public readonly reset = (): void => {
    // Cancel any in-progress initialization
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this.initializationPromise = null
    this.setState({ status: 'idle', value: undefined, error: undefined })
  }

  /**
   * React hook that subscribes to state changes
   * Returns [value, isLoading, error]
   */
  public readonly useStore = (): [T | undefined, boolean, Error | undefined] => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useSyncExternalStore(this.subscribe, this.getState, this.getState)

    return [state.value, state.status === 'loading', state.error]
  }

  private readonly setState = (newState: LazyStoreState<T>): void => {
    if (this.state !== newState) {
      this.state = newState
      this.listeners.forEach((listener) => listener())
    }
  }

  private readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export default LazyExternalStore
