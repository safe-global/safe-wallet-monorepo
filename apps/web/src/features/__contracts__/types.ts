import type { ComponentType } from 'react'
import type { RootState } from '@/store'

/**
 * Minimal feature handle - always bundled, tiny (~100 bytes).
 *
 * This is the ONLY part that gets bundled at app startup.
 * Contains just the name, flag check, and a lazy loader for the full implementation.
 *
 * @example
 * export const myFeatureHandle: FeatureHandle<MyFeatureImpl> = {
 *   name: 'my-feature',
 *   useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),
 *   load: () => import('./__internal__/feature'),
 * }
 */
export interface FeatureHandle<TImpl extends FeatureImplementation = FeatureImplementation> {
  /** Unique feature identifier used for registry lookup */
  readonly name: string

  /**
   * Feature flag hook - STATIC, always bundled.
   * Implementation should be: () => useHasFeature(FEATURES.MY_FEATURE)
   *
   * @returns true if enabled, false if disabled, undefined if still loading
   */
  useIsEnabled: () => boolean | undefined

  /**
   * Lazy loader for the full feature implementation.
   * Only called when the feature is enabled AND accessed.
   */
  load: () => Promise<{ default: TImpl }>
}

/**
 * @deprecated Use FeatureHandle instead. Kept for backward compatibility.
 */
export interface BaseFeatureContract {
  readonly name: string
  useIsEnabled: () => boolean | undefined
}

/**
 * Contract extension for features that expose React components.
 * Components should be lazy-loadable for code splitting.
 */
export interface ComponentContract {
  /**
   * Map of component names to React components.
   * Use React.lazy() for code splitting:
   * @example
   * components: {
   *   Widget: lazy(() => import('./__internal__/components/Widget')),
   * }
   */
  components?: Record<string, ComponentType<any>>
}

/**
 * Contract extension for features that expose hooks.
 * Hooks are wrapped functions that can be called by consumers.
 */
export interface HooksContract {
  /**
   * Map of hook names to hook functions.
   * Note: These should be wrapper functions, not the hooks directly.
   * @example
   * hooks: {
   *   useFeatureData: () => useFeatureDataInternal(),
   * }
   */
  hooks?: Record<string, (...args: any[]) => any>
}

/**
 * Contract extension for features that expose services.
 * Services are typically async functions or objects with methods.
 */
export interface ServicesContract {
  /**
   * Map of service names to service implementations.
   * @example
   * services: {
   *   connect: (uri: string) => walletConnectService.connect(uri),
   *   disconnect: (topic: string) => walletConnectService.disconnect(topic),
   * }
   */
  services?: Record<string, unknown>
}

/**
 * Contract extension for features that expose Redux selectors.
 * These allow other features to read from this feature's state.
 */
export interface SelectorsContract {
  /**
   * Map of selector names to selector functions.
   * @example
   * selectors: {
   *   selectIsOpen: (state: RootState) => state.myFeature.isOpen,
   * }
   */
  selectors?: Record<string, (state: RootState) => unknown>
}

/**
 * Feature implementation - the lazy-loaded part of a feature.
 * Contains components, hooks, services, and selectors.
 * This is what gets loaded when handle.load() is called.
 */
export type FeatureImplementation = Partial<ComponentContract> &
  Partial<HooksContract> &
  Partial<ServicesContract> &
  Partial<SelectorsContract>

/**
 * Full loaded feature - what useFeature() returns to consumers.
 * Combines the handle (name, useIsEnabled) with the loaded implementation.
 *
 * @example
 * interface MyFeatureContract extends FeatureContract {
 *   readonly name: 'my-feature'
 *   useIsEnabled: () => boolean | undefined
 *   components: {
 *     Widget: ComponentType<WidgetProps>
 *   }
 *   services: {
 *     myService: MyServiceType
 *   }
 * }
 */
export type FeatureContract = {
  readonly name: string
  useIsEnabled: () => boolean | undefined
} & FeatureImplementation

/**
 * Type helper to extract component props from a contract.
 * @example
 * type WidgetProps = ExtractComponentProps<MyContract, 'Widget'>
 */
export type ExtractComponentProps<T extends FeatureContract, K extends keyof NonNullable<T['components']>> =
  NonNullable<T['components']>[K] extends ComponentType<infer P> ? P : never

/**
 * Type helper to extract hook return type from a contract.
 * @example
 * type DataType = ExtractHookReturn<MyContract, 'useData'>
 */
export type ExtractHookReturn<T extends FeatureContract, K extends keyof NonNullable<T['hooks']>> = NonNullable<
  T['hooks']
>[K] extends (...args: any[]) => infer R
  ? R
  : never

/**
 * Type helper to extract selector return type from a contract.
 * @example
 * type IsOpenType = ExtractSelectorReturn<MyContract, 'selectIsOpen'>
 */
export type ExtractSelectorReturn<T extends FeatureContract, K extends keyof NonNullable<T['selectors']>> = NonNullable<
  T['selectors']
>[K] extends (state: RootState) => infer R
  ? R
  : never
