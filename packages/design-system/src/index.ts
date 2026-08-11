/**
 * The design system's public surface.
 *
 * Subpath imports are the norm in app code — `@safe-global/design-system/components/button`
 * keeps the import graph explicit and lets bundlers drop what a screen does not use. This barrel
 * exists for the cases where a single import of several primitives reads better, and as the
 * machine-readable inventory of what the package ships.
 *
 * Rules for using any of this live in packages/design-system/AGENTS.md. The short version: pick a
 * `variant`/`size` prop, never restyle geometry or colour through `className`.
 */

// The scope provider. Every design-system component must render inside one — the semantic tokens
// are defined on `.shadcn-scope`, deliberately not on `:root`.
export { ShadcnProvider, usePortalContainer, usePortalContainerElement } from './components/ShadcnProvider'

// Class-name merger used by every primitive (clsx + tailwind-merge).
export { cn } from './utils/cn'

// Breakpoint hooks the sidebar depends on; exported because app layouts need the same thresholds.
export { useIsMobile } from './hooks/use-mobile'
export { useIsTablet } from './hooks/use-tablet'

/* -------------------------------------------------------------------------- primitives */

export * from './components/accordion'
export * from './components/alert-dialog'
export * from './components/alert'
export * from './components/aspect-ratio'
export * from './components/avatar'
export * from './components/badge'
export * from './components/breadcrumb'
export * from './components/button'
export * from './components/calendar'
export * from './components/card'
export * from './components/checkbox'
export * from './components/chip'
export * from './components/collapsible'
export * from './components/combobox'
export * from './components/context-menu'
export * from './components/dialog'
export * from './components/drawer'
export * from './components/dropdown-menu'
export * from './components/empty'
export * from './components/field'
export * from './components/hover-card'
export * from './components/input-group'
export * from './components/input-otp'
export * from './components/input'
export * from './components/kbd'
export * from './components/label'
export * from './components/link'
export * from './components/list'
export * from './components/navigation-menu'
export * from './components/pagination'
export * from './components/popover'
export * from './components/progress'
export * from './components/radio-group'
export * from './components/resizable'
export * from './components/scroll-area'
export * from './components/search-input'
export * from './components/select'
export * from './components/separator'
export * from './components/sheet'
export * from './components/sidebar'
export * from './components/skeleton'
export * from './components/slider'
export * from './components/sonner'
export * from './components/spinner'
export * from './components/switch'
export * from './components/table'
export * from './components/tabs'
export * from './components/textarea'
export * from './components/toggle'
export * from './components/tooltip'
export * from './components/typography'

/* ----------------------------------------------------------------------------- presets */
/**
 * Closed compositions for recurring intents. They take semantic props, own their styling, and
 * accept no styling `className` — so a drifting override is a compile error, not a review catch.
 */

export { ActionBar, ActionButton } from './presets/ActionBar'
export { default as ChoiceButton } from './presets/ChoiceButton'
export { default as DialogActions, type ConfirmGate } from './presets/DialogActions'
export { default as IconAction } from './presets/IconAction'
export { default as OnboardingFooter } from './presets/OnboardingFooter'
export { default as SplitMenuButton } from './presets/SplitMenuButton'
export { default as SubmitButton } from './presets/SubmitButton'
