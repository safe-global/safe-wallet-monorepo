/** Minimum iframe heights for previews whose content is portalled or fixed, so it adds nothing to the document height */
export const PREVIEW_MIN_HEIGHT: Record<string, number> = {
  'alert-dialog': 480,
  calendar: 420,
  combobox: 420,
  'context-menu': 360,
  dialog: 480,
  drawer: 560,
  'dropdown-menu': 480,
  'hover-card': 320,
  'navigation-menu': 360,
  overlay: 560,
  popover: 360,
  select: 420,
  sheet: 560,
  sidebar: 640,
  sonner: 320,
  tooltip: 200,
}

export const DEFAULT_MIN_HEIGHT = 160

export const previewMinHeight = (component: string): number => PREVIEW_MIN_HEIGHT[component] ?? DEFAULT_MIN_HEIGHT

export const PREVIEW_HEIGHT_MESSAGE = 'safe-ui-preview-height'
