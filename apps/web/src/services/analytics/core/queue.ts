/**
 * localStorage-backed persistent queue for offline analytics support.
 * Handles event queuing when offline or when consent is not yet granted.
 */

import type { AnalyticsEvent } from './types'

type QueuedItem = {
  event: AnalyticsEvent
  timestamp: number
}

/**
 * Persistent queue implementation using localStorage
 */
export class PersistentQueue {
  private readonly storageKey: string
  private readonly maxItems: number
  private readonly ttlMs: number

  constructor(
    storageKey: string = 'safe_analytics_queue',
    maxItems: number = 1000,
    ttlMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days
  ) {
    this.storageKey = storageKey
    this.maxItems = maxItems
    this.ttlMs = ttlMs
  }

  /**
   * Load items from localStorage, filtering out expired ones
   */
  private load(): QueuedItem[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return []
    }

    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return []

      const items = JSON.parse(raw) as QueuedItem[]
      const now = Date.now()

      // Filter out expired items
      const validItems = items.filter((item) => now - item.timestamp <= this.ttlMs)

      // Save back if we filtered any items
      if (validItems.length !== items.length) {
        this.save(validItems)
      }

      return validItems
    } catch (error) {
      console.warn('[Analytics] Failed to load queue from localStorage:', error)
      return []
    }
  }

  /**
   * Save items to localStorage, respecting size limits
   */
  private save(items: QueuedItem[]): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      // Keep only the most recent items if we exceed the limit
      const itemsToSave = items.slice(-this.maxItems)
      localStorage.setItem(this.storageKey, JSON.stringify(itemsToSave))
    } catch (error) {
      // Storage may be full or blocked
      console.warn('[Analytics] Failed to save queue to localStorage:', error)
    }
  }

  /**
   * Add an event to the queue
   */
  enqueue(event: AnalyticsEvent): void {
    const items = this.load()
    items.push({
      event,
      timestamp: Date.now(),
    })
    this.save(items)
  }

  /**
   * Remove and return up to maxItems events from the queue
   */
  drain(maxItems: number = 100): AnalyticsEvent[] {
    const items = this.load()
    const toProcess = items.slice(0, maxItems)
    const remaining = items.slice(maxItems)

    this.save(remaining)

    return toProcess.map((item) => item.event)
  }

  /**
   * Get current queue size without draining
   */
  size(): number {
    return this.load().length
  }

  /**
   * Clear all items from the queue
   */
  clear(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.warn('[Analytics] Failed to clear queue:', error)
    }
  }
}
