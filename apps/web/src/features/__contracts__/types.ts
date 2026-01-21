import type { ComponentType } from 'react'
import type { RootState } from '@/store'

/**
 * Base contract that all features extend.
 *
 * Key concept: useIsEnabled is STATIC (always bundled, just a FEATURES enum lookup).
 * Components/hooks/services are LAZY (code-split, loaded on demand).
 */
export interface BaseFeatureContract {
  /** Unique feature identifier used for registry lookup */
  readonly name: string

  /**
   * Feature flag hook - STATIC, always bundled.
   * Implementation should be: () => useHasFeature(FEATURES.MY_FEATURE)
   *
   * This is intentionally NOT lazy - it's just a flag lookup so consumers
   * can check if a feature is enabled BEFORE loading its code.
   *
   * @returns true if enabled, false if disabled, undefined if still loading
   */
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
 * Full feature contract combining all capability contracts.
 * Use this as the base for complex features that expose multiple capabilities.
 *
 * @example
 * interface MyFeatureContract extends FeatureContract {
 *   readonly name: 'my-feature'
 *   useIsEnabled: () => boolean | undefined
 *   components: {
 *     Widget: ComponentType<WidgetProps>
 *   }
 *   hooks: {
 *     useData: () => MyData
 *   }
 * }
 */
export type FeatureContract = BaseFeatureContract &
  Partial<ComponentContract> &
  Partial<HooksContract> &
  Partial<ServicesContract> &
  Partial<SelectorsContract>

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
