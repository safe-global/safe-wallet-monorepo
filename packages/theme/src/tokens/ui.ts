/**
 * Safe UI (shadcn) tokens: CSS variable name (without `--`) to value, in output order.
 * Not part of ColorPalette, so the MUI and Tamagui outputs never see them. Palette colours are referenced, not copied.
 * Generated into packages/ui/src/styles/tokens*.css by `yarn workspace @safe-global/theme generate:ui-tokens`.
 */

import staticColors from '../palettes/static'
import { webDarkPalette, webLightPalette } from '../palettes/web'

type UiTokenMap = Readonly<Record<string, string>>

const hex = (value: string): string => value.toLowerCase()

const light: UiTokenMap = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: hex(webLightPalette.background.paper),
  'card-foreground': '#0a0a0a',
  popover: hex(webLightPalette.background.paper),
  'popover-foreground': '#0a0a0a',
  dialog: hex(webLightPalette.background.paper),
  // The one modal scrim (packages/ui/src/primitives/overlay/overlay.ts); a light tint so the blur stays visible.
  backdrop: 'rgba(0, 0, 0, 0.1)',
  primary: '#171717',
  'primary-foreground': '#fafafa',
  secondary: '#f5f5f5',
  'secondary-foreground': '#171717',
  'secondary-hover': 'var(--border)',
  muted: '#f5f5f5',
  'muted-secondary': '#fafafa',
  'muted-foreground': '#737373',
  // A well sunk into a card; pinned to the page floor so it reads as recessed in both themes.
  'surface-sunken': 'var(--color-background-main)',
  accent: '#f0fdf4',
  'accent-foreground': '#171717',
  destructive: '#dc2626',
  border: '#e5e5e5',
  input: '#ffffff',
  ring: '#d4d4d4',
  'chart-1': 'oklch(0.809 0.105 251.813)',
  'chart-2': 'oklch(0.623 0.214 259.815)',
  'chart-3': 'oklch(0.546 0.245 262.881)',
  'chart-4': 'oklch(0.488 0.243 264.376)',
  'chart-5': 'oklch(0.424 0.199 265.638)',
  radius: '1rem',
  // Light sidebar is the white paper surface, a distinct panel against the grey page.
  sidebar: 'var(--color-background-paper)',
  'sidebar-foreground': '#404040',
  'sidebar-primary': '#171717',
  'sidebar-primary-foreground': '#fafafa',
  'sidebar-accent': '#f0fdf4',
  'sidebar-accent-foreground': '#171717',
  'sidebar-border': '#e5e5e5',
  'sidebar-ring': '#d4d4d4',
  'accent-secondary': '#c4fddd',
  // Brand ink on the mint accent, both themes.
  'accent-secondary-foreground': hex(staticColors.main),
  mint: '#7ffab7',
  'accent-success': '#16a34a',
  // Figma warning surface (alert node 4316-12854) is Tailwind yellow-50/700/500, not the brand warning tint.
  'warning-subtle': '#fefce8',
  'warning-strong': '#a16207',
  'warning-accent': '#eab308',
  // Own token because dark leaves warning-accent, which turns brand coral there.
  'warning-outline': 'var(--warning-accent)',
  // Figma error/background (alert node 1255-183763); the brand token drifted to #ffe6ea.
  'error-subtle': '#fff4f6',
  // Obra DS Badge status colours (nodes 4033-8332 / 4033-8415); warning has its own dark values.
  'badge-warning-subtle': 'var(--warning-subtle)',
  'badge-warning-strong': 'var(--warning-strong)',
  'badge-dot-success': '#22c55e',
  'badge-dot-warning': '#eab308',
  // green-400 and green-500, both themes.
  'icon-brand': 'oklch(79.2% 0.209 151.711)',
  'icon-hover': 'oklch(72.3% 0.219 149.579)',
  'z-sidebar': '1300',
  'z-overlay': '1400',
  // A dialog opened from inside another overlay; both share one portal container.
  'z-nested-overlay': '1450',
  // Must beat onboard.css's --onboard-modal-z-index (1450) for dialogs the wallet-connect modal opens.
  'z-above-onboard': '1451',
  'z-picker': '1500',
  // Status tones (accent bars, status icons), from the palette so each theme keeps its own shade.
  'tone-critical': 'var(--color-error-main)',
  'tone-warning': 'var(--color-warning-main)',
  'tone-attention': 'var(--color-review-main)',
  'tone-success': 'var(--color-success-main)',
  'tone-neutral': 'var(--color-text-secondary)',
  'tone-muted': 'var(--color-text-disabled)',
  // Widget overflow pill and empty-state icon halo; the same in both themes, as the Spaces dashboard draws them.
  'widget-count': '#f0fdf4',
  'widget-count-foreground': '#166534',
  // green-100
  'widget-icon-halo': 'oklch(96.2% 0.044 156.743)',
}

const dark: UiTokenMap = {
  background: '#000000',
  foreground: '#f5f5f5',
  card: '#171717',
  'card-foreground': '#f5f5f5',
  popover: '#171717',
  'popover-foreground': '#f5f5f5',
  dialog: hex(webDarkPalette.background.paper),
  backdrop: 'rgba(0, 0, 0, 0.1)',
  primary: hex(webDarkPalette.primary.main),
  'primary-foreground': '#0a0a0a',
  secondary: '#262626',
  'secondary-foreground': '#f5f5f5',
  'secondary-hover': 'rgba(255, 255, 255, 0.12)',
  muted: '#262626',
  'muted-secondary': 'var(--color-background-paper)',
  'muted-foreground': '#a3a3a3',
  'surface-sunken': 'var(--color-background-main)',
  accent: '#052e16',
  'accent-foreground': '#f5f5f5',
  // Brand dark error.main; the old #9e4042 was sub-AA as text on dark surfaces.
  destructive: hex(webDarkPalette.error.main),
  'destructive-foreground': '#ffffff',
  border: '#404040',
  input: '#ffffff0d',
  ring: '#404040',
  'chart-1': 'oklch(0.809 0.105 251.813)',
  'chart-2': 'oklch(0.623 0.214 259.815)',
  'chart-3': 'oklch(0.546 0.245 262.881)',
  'chart-4': 'oklch(0.488 0.243 264.376)',
  'chart-5': 'oklch(0.424 0.199 265.638)',
  // Matches the page background so the sidebar blends in without a panel edge.
  sidebar: 'var(--color-background-main)',
  'sidebar-foreground': '#d4d4d4',
  'sidebar-primary': '#fafafa',
  'sidebar-primary-foreground': '#171717',
  'sidebar-accent': '#052e16',
  'sidebar-accent-foreground': '#f5f5f5',
  'sidebar-border': '#262626',
  'sidebar-ring': '#404040',
  'accent-secondary': '#c4fddd',
  'accent-secondary-foreground': hex(staticColors.main),
  mint: '#7ffab7',
  'accent-success': hex(webDarkPalette.success.main),
  // No dark warning/error spec in Figma, so dark keeps the brand tints.
  'warning-subtle': 'var(--color-warning-background)',
  'warning-strong': 'var(--color-warning1-text)',
  'warning-accent': 'var(--color-warning-main)',
  'warning-outline': 'var(--warning-strong)',
  'error-subtle': 'var(--color-error-background)',
  // Obra DS Badge dark spec: yellow-500 ink, yellow-400 dot.
  'badge-warning-subtle': '#301d02',
  'badge-warning-strong': '#eab308',
  'badge-dot-warning': '#facc15',
  'tone-critical': 'var(--color-error-main)',
  'tone-warning': 'var(--color-warning-main)',
  'tone-attention': 'var(--color-review-main)',
  'tone-success': 'var(--color-success-main)',
  'tone-neutral': 'var(--color-text-secondary)',
  'tone-muted': 'var(--color-text-disabled)',
  'widget-count': '#f0fdf4',
  'widget-count-foreground': '#166534',
  'widget-icon-halo': 'oklch(96.2% 0.044 156.743)',
}

export const uiTokens: { light: UiTokenMap; dark: UiTokenMap } = { light, dark }
