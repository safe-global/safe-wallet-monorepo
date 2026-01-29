/**
 * Feature Module Contract: Earn Feature
 *
 * This file defines the TypeScript interface contract for the earn feature's public API.
 * External code importing from `@/features/earn` must adhere to these interfaces.
 *
 * Feature: 002-refactor-earn-feature
 * Date: 2026-01-15
 */

import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { EARN_LABELS } from '@/services/analytics/events/earn'
import type { ReactElement } from 'react'

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

/**
 * Main earn feature component (default export).
 *
 * This is the primary page component that handles:
 * - Consent disclaimer flow
 * - Blocked address checks
 * - Info panel / widget display logic
 *
 * Usage:
 * ```typescript
 * import dynamic from 'next/dynamic'
 * const LazyEarnPage = dynamic(() => import('@/features/earn'), { ssr: false })
 * ```
 *
 * @returns ReactElement - The earn page UI
 */
export default function EarnPage(): ReactElement

/**
 * Button component for navigating to the earn page with a pre-selected asset.
 *
 * Displayed on asset rows in the dashboard and balances table.
 * Clicking the button navigates to `/earn?asset_id={chainId}_{tokenAddress}`.
 *
 * Usage:
 * ```typescript
 * import { EarnButton } from '@/features/earn'
 *
 * <EarnButton
 *   tokenInfo={balance.tokenInfo}
 *   trackingLabel={EARN_LABELS.dashboard_asset}
 *   compact={true}
 * />
 * ```
 *
 * @param props - EarnButtonProps
 * @returns ReactElement - The earn button UI
 */
export function EarnButton(props: EarnButtonProps): ReactElement

/**
 * Hook to check if the earn feature is enabled for the current chain and user.
 *
 * Combines two checks:
 * 1. Feature flag from chain configuration (FEATURES.EARN)
 * 2. Geoblocking status (user's country is not blocked)
 *
 * Usage:
 * ```typescript
 * import { useIsEarnFeatureEnabled } from '@/features/earn'
 *
 * const isEarnEnabled = useIsEarnFeatureEnabled()
 *
 * if (isEarnEnabled === undefined) {
 *   // Loading state - feature flag not yet resolved
 *   return null
 * }
 *
 * if (isEarnEnabled === false) {
 *   // Feature disabled or country blocked
 *   return <DisabledMessage />
 * }
 *
 * // Feature enabled
 * return <EarnFeature />
 * ```
 *
 * @returns boolean | undefined
 *   - `undefined`: Loading (chain config not yet fetched)
 *   - `false`: Feature disabled for current chain OR user's country is blocked
 *   - `true`: Feature enabled and user can access it
 */
export function useIsEarnFeatureEnabled(): boolean | undefined

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/**
 * Props for the EarnButton component.
 */
export interface EarnButtonProps {
  /**
   * Token information from the balance object.
   * Used to construct the asset_id query parameter.
   */
  tokenInfo: Balance['tokenInfo']

  /**
   * Analytics tracking label to identify where the button was clicked.
   * Examples: 'dashboard_asset', 'asset', 'info_asset'
   */
  trackingLabel: EARN_LABELS

  /**
   * Whether to render a compact text button (true) or full contained button (false).
   * @default true
   */
  compact?: boolean

  /**
   * Whether to render only an icon button (true) or button with text (false).
   * @default false
   */
  onlyIcon?: boolean
}

// ============================================================================
// VAULT TRANSACTION COMPONENTS (PUBLIC API)
// ============================================================================

/**
 * These vault transaction components are part of the public API because they are
 * used by external transaction flow components (confirmation views, transaction
 * details, and transaction info displays).
 *
 * Public Vault Components:
 * - VaultDepositConfirmation: Transaction confirmation for deposits
 * - VaultRedeemConfirmation: Transaction confirmation for withdrawals
 * - VaultDepositTxDetails: Transaction details for deposits
 * - VaultDepositTxInfo: Transaction info for deposits
 * - VaultRedeemTxDetails: Transaction details for withdrawals
 * - VaultRedeemTxInfo: Transaction info for withdrawals
 */
export function VaultDepositConfirmation(props: {
  txInfo: VaultDepositTransactionInfo
  isTxDetails?: boolean
}): ReactElement
export function VaultRedeemConfirmation(props: {
  txInfo: VaultRedeemTransactionInfo
  isTxDetails?: boolean
}): ReactElement
export function VaultDepositTxDetails(props: { info: VaultDepositTransactionInfo }): ReactElement
export function VaultRedeemTxDetails(props: { info: VaultRedeemTransactionInfo }): ReactElement
export function VaultDepositTxInfo(props: { info: VaultDepositTransactionInfo }): ReactElement
export function VaultRedeemTxInfo(props: { info: VaultRedeemTransactionInfo }): ReactElement

// ============================================================================
// INTERNAL API (NOT EXPORTED FROM PUBLIC API)
// ============================================================================

/**
 * The following types and components are used internally within the earn feature
 * but are NOT part of the public API. External code should not import these.
 *
 * Internal Components:
 * - EarnView: Decides whether to show EarnInfo or EarnWidget based on info panel state
 * - EarnInfo: Informational panel shown before first use
 * - EarnWidget: Kiln widget iframe wrapper
 *
 * Internal Hooks:
 * - useGetWidgetUrl: Generates Kiln widget URL with theme and asset parameters
 *
 * Internal Services:
 * - utils.ts: Utility functions (vaultTypeToLabel, isEligibleEarnToken)
 *
 * Internal Constants:
 * - EARN_TITLE: Title for the earn feature
 * - WIDGET_TESTNET_URL: Kiln widget URL for testnets
 * - WIDGET_PRODUCTION_URL: Kiln widget URL for production chains
 * - EARN_CONSENT_STORAGE_KEY: LocalStorage key for consent state
 * - EARN_HELP_ARTICLE: URL to help article
 * - widgetAppData: Configuration for widget
 * - hideEarnInfoStorageKey: LocalStorage key for info panel state
 * - EligibleEarnTokens: Map of eligible tokens per chain
 * - VaultAPYs: APY data for vaults
 * - ApproximateAPY: Average APY value
 * - APYDisclaimer: Disclaimer text for APY display
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Lazy loading the earn page
 *
 * File: apps/web/src/pages/earn.tsx
 *
 * ```typescript
 * import type { NextPage } from 'next'
 * import Head from 'next/head'
 * import dynamic from 'next/dynamic'
 * import { Typography } from '@mui/material'
 * import { BRAND_NAME } from '@/config/constants'
 * import { useIsEarnFeatureEnabled } from '@/features/earn'
 *
 * const LazyEarnPage = dynamic(() => import('@/features/earn'), { ssr: false })
 *
 * const EarnPage: NextPage = () => {
 *   const isFeatureEnabled = useIsEarnFeatureEnabled()
 *
 *   return (
 *     <>
 *       <Head>
 *         <title>{`${BRAND_NAME} – Earn`}</title>
 *       </Head>
 *
 *       {isFeatureEnabled === true ? (
 *         <LazyEarnPage />
 *       ) : isFeatureEnabled === false ? (
 *         <main>
 *           <Typography textAlign="center" my={3}>
 *             Earn is not available on this network.
 *           </Typography>
 *         </main>
 *       ) : null}
 *     </>
 *   )
 * }
 *
 * export default EarnPage
 * ```
 */

/**
 * Example 2: Using EarnButton in a component
 *
 * File: apps/web/src/components/dashboard/Assets/index.tsx
 *
 * ```typescript
 * import { EarnButton } from '@/features/earn'
 * import { EARN_LABELS } from '@/services/analytics/events/earn'
 *
 * function AssetRow({ balance }) {
 *   return (
 *     <div>
 *       <EarnButton
 *         tokenInfo={balance.tokenInfo}
 *         trackingLabel={EARN_LABELS.dashboard_asset}
 *         compact={true}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Example 3: Checking if earn is enabled
 *
 * File: apps/web/src/components/dashboard/index.tsx
 *
 * ```typescript
 * import { useIsEarnFeatureEnabled } from '@/features/earn'
 *
 * function Dashboard() {
 *   const isEarnEnabled = useIsEarnFeatureEnabled()
 *
 *   const shouldShowEarnBanner = isEarnEnabled === true && someOtherCondition
 *
 *   return (
 *     <div>
 *       {shouldShowEarnBanner && <EarnBanner />}
 *     </div>
 *   )
 * }
 * ```
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Migrating from old deep imports to new public API:
 *
 * BEFORE (deep imports - will break after refactor):
 * ```typescript
 * import EarnButton from '@/features/earn/components/EarnButton'
 * import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
 * ```
 *
 * AFTER (public API - correct):
 * ```typescript
 * import { EarnButton, useIsEarnFeatureEnabled } from '@/features/earn'
 * ```
 *
 * Files requiring migration:
 * - apps/web/src/components/dashboard/Assets/index.tsx
 * - apps/web/src/components/balances/AssetsTable/PromoButtons.tsx
 * - apps/web/src/components/dashboard/index.tsx
 */
