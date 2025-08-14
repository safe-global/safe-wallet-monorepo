/**
 * Centralized event catalog with type-safe constants and optional Zod validation.
 * This replaces string literals and provides a single source of truth for all analytics events.
 */

import { z } from 'zod'
import type { EventContext } from '../core/types'

/**
 * Event schemas with Zod for optional runtime validation
 * Each schema defines the expected payload structure for an event
 */
export const EventSchemas = {
  // User & Authentication Events
  user_signed_in: z.object({
    method: z.enum(['password', 'wallet', 'social']),
    provider: z.string().optional(),
    experiment: z.string().optional(),
  }),

  user_signed_out: z.object({
    session_duration: z.number().optional(),
  }),

  // Wallet Events
  wallet_connected: z.object({
    wallet_label: z.string(),
    wallet_address: z.string(),
    chain_id: z.string(),
  }),

  wallet_disconnected: z.object({
    wallet_label: z.string(),
    session_duration: z.number().optional(),
  }),

  // Safe Management Events
  safe_created: z.object({
    owners: z.number(),
    threshold: z.number(),
    chain_id: z.string(),
    safe_address: z.string(),
    creation_method: z.enum(['counterfactual', 'direct']).optional(),
  }),

  safe_activated: z.object({
    safe_address: z.string(),
    chain_id: z.string(),
    activation_method: z.enum(['with_tx', 'without_tx']).optional(),
  }),

  safe_opened: z.object({
    safe_address: z.string(),
    chain_id: z.string(),
    source: z.enum(['direct', 'shared_link', 'bookmark']).optional(),
  }),

  // Transaction Events
  transaction_created: z.object({
    tx_type: z.enum([
      'owner_add',
      'owner_remove',
      'owner_swap',
      'owner_threshold_change',
      'guard_remove',
      'module_remove',
      'transfer_token',
      'batch_transfer_token',
      'transfer_nft',
      'batch',
      'rejection',
      'typed_message',
      'nested_safe',
      'walletconnect',
      'custom',
      'native_bridge',
      'native_swap',
      'native_earn',
      'native_swap_lifi',
      'bulk_execute',
      'activate_without_tx',
      'activate_with_tx',
    ]),
    safe_address: z.string(),
    chain_id: z.string(),
    amount: z.string().optional(),
    asset: z.string().optional(),
    creation_method: z.enum(['standard', 'via_role', 'via_spending_limit', 'via_proposer', 'via_parent']).optional(),
  }),

  transaction_confirmed: z.object({
    tx_type: z.string(),
    safe_address: z.string(),
    chain_id: z.string(),
    confirmation_method: z.enum(['standard', 'via_parent', 'in_parent']).optional(),
  }),

  transaction_executed: z.object({
    tx_type: z.string(),
    safe_address: z.string(),
    chain_id: z.string(),
    execution_method: z
      .enum(['standard', 'speed_up', 'via_spending_limit', 'via_role', 'via_parent', 'in_parent'])
      .optional(),
  }),

  // Safe App Events
  safe_app_launched: z.object({
    app_name: z.string(),
    app_url: z.string(),
    category: z.string().optional(),
    safe_address: z.string(),
    chain_id: z.string(),
  }),

  safe_app_interaction: z.object({
    app_name: z.string(),
    app_url: z.string(),
    action: z.enum([
      'pin',
      'unpin',
      'copy_share_url',
      'search',
      'add_custom_app',
      'open_transaction_modal',
      'propose_transaction',
    ]),
    safe_address: z.string(),
    chain_id: z.string(),
  }),

  // Page/Navigation Events
  page_view: z.object({
    page_title: z.string().optional(),
    page_path: z.string(),
    page_url: z.string().optional(),
    referrer: z.string().optional(),
  }),

  // UI Interaction Events
  clicked_cta: z.object({
    label: z.string(),
    page: z.string(),
    location: z.string().optional(),
  }),

  modal_opened: z.object({
    modal_name: z.string(),
    trigger: z.string().optional(),
  }),

  modal_closed: z.object({
    modal_name: z.string(),
    action: z.enum(['close_button', 'backdrop', 'escape', 'success', 'cancel']).optional(),
  }),

  // Feature Usage Events
  feature_used: z.object({
    feature_name: z.string(),
    context: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
  }),

  // Error Events
  error_shown: z.object({
    error_code: z.string(),
    error_message: z.string().optional(),
    context: z.string().optional(),
  }),
} as const

/**
 * Canonical event name constants - use these instead of string literals
 * This provides compile-time safety and prevents typos
 */
export const EVENT = {
  // User & Authentication
  UserSignedIn: 'user_signed_in',
  UserSignedOut: 'user_signed_out',

  // Wallet
  WalletConnected: 'wallet_connected',
  WalletDisconnected: 'wallet_disconnected',

  // Safe Management
  SafeCreated: 'safe_created',
  SafeActivated: 'safe_activated',
  SafeOpened: 'safe_opened',

  // Transactions
  TransactionCreated: 'transaction_created',
  TransactionConfirmed: 'transaction_confirmed',
  TransactionExecuted: 'transaction_executed',

  // Safe Apps
  SafeAppLaunched: 'safe_app_launched',
  SafeAppInteraction: 'safe_app_interaction',

  // Page/Navigation
  PageView: 'page_view',

  // UI Interactions
  ClickedCta: 'clicked_cta',
  ModalOpened: 'modal_opened',
  ModalClosed: 'modal_closed',

  // Features
  FeatureUsed: 'feature_used',

  // Errors
  ErrorShown: 'error_shown',
} as const

/**
 * Type-safe event name union derived from the catalog
 */
export type EventName = (typeof EVENT)[keyof typeof EVENT]

/**
 * Event map that ties event names to their payload types
 */
export type EventMap = {
  [K in EventName]: z.infer<(typeof EventSchemas)[K]>
}

/**
 * Discriminated union that ensures event name and payload are correctly paired
 * This prevents mismatched name/payload combinations at compile time
 */
export type EventUnion<E extends Record<string, Record<string, unknown>> = EventMap> = {
  [K in keyof E & string]: {
    name: K
    payload: E[K]
    context?: EventContext
    timestamp?: number
  }
}[keyof E & string]

/**
 * Optional runtime validation for development/testing
 * Only validates in non-production builds to avoid performance impact
 */
export const validateEvent = <K extends EventName>(name: K, payload: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const schema = EventSchemas[name] as z.ZodTypeAny
      schema.parse(payload)
    } catch (error) {
      console.warn(`[Analytics] Event validation failed for "${name}":`, error)
      // Don't throw in production-like environments to avoid breaking analytics
    }
  }
}

/**
 * Type-safe event creator with optional runtime validation
 */
export const createEvent =
  <E extends EventMap = EventMap>() =>
  <K extends EventName>(name: K, payload: E[K], context?: EventContext): EventUnion<E> => {
    // Validate in development
    validateEvent(name, payload)

    return {
      name,
      payload,
      context,
      timestamp: Date.now(),
    } as EventUnion<E>
  }

/**
 * Default event creator instance
 */
export const event = createEvent<EventMap>()
