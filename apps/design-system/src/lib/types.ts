export interface StoryEntry {
  /** Export name in the story file, e.g. `AllVariants` */
  exportName: string
  /** Kebab-case slug used in preview URLs, e.g. `all-variants` */
  slug: string
  /** Human title, e.g. `All Variants` */
  title: string
  /** JSDoc above the story export, if any */
  description?: string
}

/** `primitive`: a shadcn component under `@safe-global/ui/primitives/*`; `component`: a Safe component under `@safe-global/ui/components/*` */
export type Layer = 'primitive' | 'component'

export interface StoryFileEntry {
  /** Component name, the last segment of its package export key */
  component: string
  layer: Layer
  /** Storybook title, e.g. `UI/Button` */
  title: string
  stories: StoryEntry[]
}

/** `src/generated/story-index.json`: every component with its visible stories, in file order */
export type StoryIndex = StoryFileEntry[]

/** `src/generated/stories.json`: component → story slug → printed source for the Code tab */
export type StorySource = Record<string, Record<string, string>>

export interface PropDoc {
  name: string
  type: string
  description?: string
  default?: string
  required: boolean
}

export interface ComponentPropsDoc {
  displayName: string
  description?: string
  props: PropDoc[]
}

export interface CvaVariantsDoc {
  name: string
  variants: Record<string, string[]>
  defaultVariants: Record<string, string>
}

/** `src/generated/props/<component>.json` */
export interface PropsDoc {
  component: string
  components: ComponentPropsDoc[]
  cva: CvaVariantsDoc[]
  /** `@base-ui/react/<part>` imports of the component file, for the Base UI reference link */
  baseUi: string[]
}

export type TokenGroup = 'color' | 'palette' | 'spacing' | 'radius' | 'z-index' | 'other'

/** One row of `src/generated/tokens.json` */
export interface TokenEntry {
  name: string
  /** Value on `:root`; absent when the variable is only declared on `.dark` */
  light?: string
  dark?: string
  group: TokenGroup
  /** Example utility the token maps to through `@theme inline`, e.g. `bg-primary` */
  tailwind?: string
}

export interface ThemeMapping {
  /** Theme variable, e.g. `--color-primary` */
  name: string
  value: string
}

/** `src/generated/tokens.json` */
export interface TokensDoc {
  tokens: TokenEntry[]
  theme: ThemeMapping[]
  fontSans: string
}

/** One entry of `src/generated/rules.json` */
export interface RuleDoc {
  element: string
  /** Component page the element belongs to, or null for wallet-only presets */
  component: string | null
  classPrefixes: string[]
  dont: string
  do: string
  example: string
  escapeHatch: string
}

/** `src/generated/icons.json`: icon name → components that import it */
export type IconList = Array<{ name: string; components: string[] }>
