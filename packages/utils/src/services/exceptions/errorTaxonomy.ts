/**
 * Error taxonomy for the "Error Surfaced" analytics event (WA-2775).
 *
 * Every coded error (see `ErrorCodes.ts`) is classified into a stable,
 * enum-only vocabulary so it can be aggregated in Mixpanel without ever
 * carrying free-text or PII. `ErrorDomain` is a fixed set of 14 values;
 * `frontend_exception` is the fallback for uncaught / unmapped errors.
 */

export enum ErrorDomain {
  WALLET_CONNECTION = 'wallet_connection',
  SIGNING = 'signing',
  SAFE_LOADING = 'safe_loading',
  TX_CREATION = 'tx_creation',
  SIMULATION = 'simulation',
  TX_PROPOSAL = 'tx_proposal',
  TX_EXECUTION = 'tx_execution',
  OFF_CHAIN_ACTION = 'off_chain_action',
  AUTH = 'auth',
  API = 'api',
  RPC = 'rpc',
  DATA_LOADING = 'data_loading',
  WALLETCONNECT = 'walletconnect',
  FRONTEND_EXCEPTION = 'frontend_exception',
}

export enum ErrorLayer {
  OFF_CHAIN = 'off_chain',
  ON_CHAIN = 'on_chain',
}

export enum ErrorType {
  // Refined by message matchers (cross-domain causes)
  USER_REJECTED = 'user_rejected',
  ETH_SIGN_DISABLED = 'eth_sign_disabled',
  WALLET_TIMEOUT = 'wallet_timeout',
  CHAIN_MISMATCH = 'chain_mismatch',
  LEDGER_ERROR = 'ledger_error',
  NONCE_CONFLICT = 'nonce_conflict',
  SLIPPAGE_EXCEEDED = 'slippage_exceeded',
  ORDER_EXPIRED = 'order_expired',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  ON_CHAIN_REVERT = 'on_chain_revert',
  // Per-code defaults (from ERROR_CODE_MAP)
  ADDRESS_INVALID = 'address_invalid',
  ADDRESS_RESOLUTION_FAILED = 'address_resolution_failed',
  TX_CREATION_FAILED = 'tx_creation_failed',
  TX_DECODING_FAILED = 'tx_decoding_failed',
  TX_PROPOSAL_FAILED = 'tx_proposal_failed',
  TX_EXECUTION_FAILED = 'tx_execution_failed',
  OFF_CHAIN_ACTION_FAILED = 'off_chain_action_failed',
  RECOVERY_FAILED = 'recovery_failed',
  DELEGATION_FAILED = 'delegation_failed',
  WALLET_CONNECTION_FAILED = 'wallet_connection_failed',
  AUTH_FAILED = 'auth_failed',
  SIMULATION_FAILED = 'simulation_failed',
  SAFE_LOADING_FAILED = 'safe_loading_failed',
  FETCH_FAILED = 'fetch_failed',
  API_ERROR = 'api_error',
  RPC_ERROR = 'rpc_error',
  GAS_ESTIMATION_FAILED = 'gas_estimation_failed',
  STORAGE_FAILED = 'storage_failed',
  CLIPBOARD_ERROR = 'clipboard_error',
  NOTIFICATION_ERROR = 'notification_error',
  SAFE_APP_FAILED = 'safe_app_failed',
  FEATURE_LOAD_FAILED = 'feature_load_failed',
  UNKNOWN = 'unknown',
}

export interface ErrorClassification {
  domain: ErrorDomain
  type: ErrorType
  layer: ErrorLayer
}

/**
 * Base classification for every live coded error. `layer` defaults to
 * `off_chain`; the normalizer promotes it to `on_chain` when it detects an
 * on-chain revert signature (e.g. a `GS###` code) in the message. `type` is a
 * sensible default that the normalizer may refine (e.g. to `user_rejected`).
 *
 * Keyed by the numeric part of the error code. Dead codes (104, 108, 201, 607,
 * 608, 610, 620, 630, 631, 632, 800, 810, 902) are intentionally omitted.
 */
export const ERROR_CODE_MAP: Record<number, ErrorClassification> = {
  // 1xx — address / wallet connection
  100: { domain: ErrorDomain.TX_CREATION, type: ErrorType.ADDRESS_INVALID, layer: ErrorLayer.OFF_CHAIN },
  101: { domain: ErrorDomain.TX_CREATION, type: ErrorType.ADDRESS_RESOLUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  103: { domain: ErrorDomain.TX_CREATION, type: ErrorType.TX_CREATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  105: { domain: ErrorDomain.RPC, type: ErrorType.RPC_ERROR, layer: ErrorLayer.OFF_CHAIN },
  106: { domain: ErrorDomain.WALLET_CONNECTION, type: ErrorType.WALLET_CONNECTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  107: { domain: ErrorDomain.WALLET_CONNECTION, type: ErrorType.WALLET_CONNECTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  109: { domain: ErrorDomain.AUTH, type: ErrorType.AUTH_FAILED, layer: ErrorLayer.OFF_CHAIN },

  // 2xx — simulation
  200: { domain: ErrorDomain.SIMULATION, type: ErrorType.SIMULATION_FAILED, layer: ErrorLayer.OFF_CHAIN },

  // 4xx — notifications
  400: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.NOTIFICATION_ERROR, layer: ErrorLayer.OFF_CHAIN },
  401: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.NOTIFICATION_ERROR, layer: ErrorLayer.OFF_CHAIN },

  // 6xx — backend / data
  600: { domain: ErrorDomain.SAFE_LOADING, type: ErrorType.SAFE_LOADING_FAILED, layer: ErrorLayer.OFF_CHAIN },
  601: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  602: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  603: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  604: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  609: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  611: { domain: ErrorDomain.RPC, type: ErrorType.RPC_ERROR, layer: ErrorLayer.OFF_CHAIN },
  612: { domain: ErrorDomain.RPC, type: ErrorType.GAS_ESTIMATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  613: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  616: { domain: ErrorDomain.API, type: ErrorType.API_ERROR, layer: ErrorLayer.OFF_CHAIN },
  619: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  621: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  633: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.NOTIFICATION_ERROR, layer: ErrorLayer.OFF_CHAIN },
  640: { domain: ErrorDomain.AUTH, type: ErrorType.AUTH_FAILED, layer: ErrorLayer.OFF_CHAIN },
  650: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.FETCH_FAILED, layer: ErrorLayer.OFF_CHAIN },

  // 7xx — storage / clipboard
  700: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  701: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  702: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  703: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  704: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  705: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  706: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.STORAGE_FAILED, layer: ErrorLayer.OFF_CHAIN },
  707: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.CLIPBOARD_ERROR, layer: ErrorLayer.OFF_CHAIN },
  708: { domain: ErrorDomain.DATA_LOADING, type: ErrorType.CLIPBOARD_ERROR, layer: ErrorLayer.OFF_CHAIN },

  // 8xx — transactions
  801: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  804: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  805: { domain: ErrorDomain.TX_PROPOSAL, type: ErrorType.TX_PROPOSAL_FAILED, layer: ErrorLayer.OFF_CHAIN },
  806: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.OFF_CHAIN_ACTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  807: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.OFF_CHAIN_ACTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  808: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  809: { domain: ErrorDomain.TX_CREATION, type: ErrorType.TX_DECODING_FAILED, layer: ErrorLayer.OFF_CHAIN },
  811: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.RECOVERY_FAILED, layer: ErrorLayer.OFF_CHAIN },
  812: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.RECOVERY_FAILED, layer: ErrorLayer.OFF_CHAIN },
  813: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.RECOVERY_FAILED, layer: ErrorLayer.OFF_CHAIN },
  814: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  815: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  816: { domain: ErrorDomain.TX_CREATION, type: ErrorType.TX_CREATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  817: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  818: { domain: ErrorDomain.TX_CREATION, type: ErrorType.TX_CREATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  819: { domain: ErrorDomain.TX_CREATION, type: ErrorType.TX_CREATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  820: { domain: ErrorDomain.OFF_CHAIN_ACTION, type: ErrorType.DELEGATION_FAILED, layer: ErrorLayer.OFF_CHAIN },
  821: { domain: ErrorDomain.TX_EXECUTION, type: ErrorType.TX_EXECUTION_FAILED, layer: ErrorLayer.OFF_CHAIN },

  // 9xx — Safe Apps / feature loading
  900: { domain: ErrorDomain.API, type: ErrorType.SAFE_APP_FAILED, layer: ErrorLayer.OFF_CHAIN },
  901: { domain: ErrorDomain.API, type: ErrorType.SAFE_APP_FAILED, layer: ErrorLayer.OFF_CHAIN },
  903: { domain: ErrorDomain.API, type: ErrorType.SAFE_APP_FAILED, layer: ErrorLayer.OFF_CHAIN },
  905: { domain: ErrorDomain.FRONTEND_EXCEPTION, type: ErrorType.SAFE_APP_FAILED, layer: ErrorLayer.OFF_CHAIN },
  906: { domain: ErrorDomain.FRONTEND_EXCEPTION, type: ErrorType.FEATURE_LOAD_FAILED, layer: ErrorLayer.OFF_CHAIN },
}

/**
 * Fallback domain by "hundred" for codes not present in ERROR_CODE_MAP, so an
 * unclassified-but-coded error still lands in a meaningful bucket rather than
 * `frontend_exception`. Keeps AC5 (`real Error Type, not unknown`) achievable.
 */
export const DOMAIN_BY_HUNDRED: Record<number, ErrorDomain> = {
  1: ErrorDomain.WALLET_CONNECTION,
  2: ErrorDomain.SIMULATION,
  4: ErrorDomain.DATA_LOADING,
  6: ErrorDomain.DATA_LOADING,
  7: ErrorDomain.DATA_LOADING,
  8: ErrorDomain.TX_EXECUTION,
  9: ErrorDomain.API,
}
