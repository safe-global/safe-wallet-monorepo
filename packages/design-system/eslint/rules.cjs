/**
 * Design-system lint guards, owned by the design system rather than by any one app.
 *
 * CommonJS on purpose: `eslint.config.mjs` files consume it through ./index.mjs, and the guard
 * test (`rules.test.ts`, run by Jest in CJS mode) requires it directly. A single .mjs module
 * could not serve both — Jest treats .mjs as native ESM and cannot require it.
 *
 * These rules are the machine-readable half of the contract in
 * `packages/design-system/AGENTS.md`: a primitive's geometry and skin belong to its
 * `variant`/`size` props, and `className` is layout-only. They live here so every
 * consumer enforces the same contract — `apps/web` and `apps/web-tanstack` render the
 * same components, and for a long time only the former had these rules.
 *
 * Usage (flat config):
 *
 *   import { designSystemRestrictedSyntax } from '@safe-global/design-system/eslint/index.mjs'
 *   // ...
 *   rules: { 'no-restricted-syntax': ['error', ...designSystemRestrictedSyntax] }
 *
 * Every rule is escapable with `// eslint-disable-next-line no-restricted-syntax -- <reason>`
 * on the primitive `<Button>` etc. That escape is deliberate: it is greppable and shows up
 * in review, which a silent `className` override does not.
 */

const DS_AGENTS = 'packages/design-system/AGENTS.md'
const DS_COMPONENTS = 'packages/design-system/src/components'
const ESCAPE = 'Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.'

/**
 * Button-styling guard: flags size/skin utilities (owned by the `size`/`variant` props)
 * set via `className` on a <Button> or a closed button preset. Matches the literal even
 * inside cn(...).
 */
const dsButtonClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-)/]`,
  message,
})

/**
 * Card-styling guard. Card owns spacing (gap/padding), radius, and surface
 * (bg/border/shadow) via its `size`/`variant`/`radius` props — so this rule flags a wider
 * set than the button rule: `gap-`, full-side `p-`/`pt-`/`pb-`, `border`, and `shadow-`.
 * `className` stays layout-only (w-*, margins, flex/grid).
 */
const dsCardClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|p-|px-|py-|pt-|pb-|pl-|pr-|gap-|text-(xs|sm|base|lg)|rounded-|bg-|border|shadow-)/]`,
  message,
})

/**
 * Input-styling guard. Input/InputGroup own height (`inputSize`) and skin (`variant`:
 * bg/border) — so this flags `h-`, `px-`/`py-`, `rounded-`, `bg-`, `border`, and font
 * sizes on className. `w-*`, margins, and flex/grid stay layout-only.
 */
const dsInputClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-|border)/]`,
  message,
})

/**
 * Tabs-styling guard. TabsList owns bg/padding/height/radius/gap via its `variant`
 * (underline/toggle, + tone/size) and TabsTrigger owns its per-variant styling — so call
 * sites pass only `variant` + layout-only className.
 */
const dsTabsClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|p-|px-|py-|pt-|pb-|pl-|pr-|gap-|text-(xs|sm|base|lg)|rounded-|bg-|border|shadow-)/]`,
  message,
})

/**
 * Badge/Chip-styling guard. Badge/Chip own geometry (`size`/`shape`) and colour
 * (`variant`) — so this flags `h-`, `px-`/`py-`, font sizes (incl. arbitrary
 * `text-[10px]`/`text-[var(--…)]`), `rounded-`, `bg-`, and `border`.
 */
const dsBadgeClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|text-\\[|rounded-|bg-|border)/]`,
  message,
})

/**
 * Dialog/Sheet/Drawer-styling guard. Content owns width (`size`), body `padding`, and
 * `surface` (bg/border/shadow); Header/Footer own `divided`. Deliberately does NOT flag
 * `max-h-`, `w-full`, `w-3/4`, flex/grid or overflow — those stay layout-only.
 */
const dsDialogClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(p-|px-|py-|pt-|pb-|gap-|max-w-|w-\\[|rounded-|bg-|border|shadow-)/]`,
  message,
})

const CARD_SLOTS = ['Card', 'CardHeader', 'CardContent', 'CardFooter', 'CardTitle', 'CardDescription', 'CardAction']

const INPUT_SLOTS = [
  'Input',
  'InputGroup',
  'InputGroupInput',
  'InputGroupAddon',
  'InputGroupText',
  'InputGroupTextarea',
  'InputGroupButton',
]

const OVERLAY_SLOTS = [
  'DialogContent',
  'DialogHeader',
  'DialogFooter',
  'SheetContent',
  'SheetHeader',
  'SheetFooter',
  'DrawerContent',
  'DrawerHeader',
  'DrawerFooter',
]

/**
 * The assembled `no-restricted-syntax` entries. Spread these into the rule:
 * `'no-restricted-syntax': ['error', ...designSystemRestrictedSyntax]`.
 */
const designSystemRestrictedSyntax = [
  dsButtonClassnameRule(
    'Button',
    `Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <Button> — use a \`size\`/\`variant\` prop. See the UI/Button story and ${DS_AGENTS}; add a variant/size to ${DS_COMPONENTS}/button.tsx if none fits. The only sanctioned raw-styling escape is \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
  ),
  dsButtonClassnameRule(
    'SubmitButton',
    'SubmitButton is a closed preset and takes no styling className — use `fullWidth` for layout, or the primitive <Button> for a genuine one-off.',
  ),
  dsButtonClassnameRule(
    'ActionButton',
    'ActionButton is a closed preset and takes no styling className — use `fullWidth` for layout, or the primitive <Button> for a genuine one-off.',
  ),
  dsButtonClassnameRule(
    'IconAction',
    'IconAction is a closed preset (ghost + icon-sm) and takes no styling className — use the primitive <Button> for a genuine one-off.',
  ),
  dsButtonClassnameRule(
    'SelectTrigger',
    `Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <SelectTrigger> — use \`size\` ('sm'|'default'|'lg' — match the height of the button/field on the same row) / \`variant\` ('default'|'ghost'). See the UI/Select story; add a variant to ${DS_COMPONENTS}/select.tsx if none fits. ${ESCAPE}`,
  ),
  ...CARD_SLOTS.map((element) =>
    dsCardClassnameRule(
      element,
      `Don't set spacing/surface/radius utilities (gap-*, p-*/px-*/py-*, rounded-*, bg-*, border, shadow-*, text-xs|sm|base|lg) on <${element}> — use the \`size\` ('sm'|'default'|'lg'|'none'), \`variant\` ('outlined'|'muted'), and \`radius\` props. \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Card story; add a variant/size to ${DS_COMPONENTS}/card.tsx if none fits. ${ESCAPE}`,
    ),
  ),
  dsCardClassnameRule(
    'SettingsCard',
    `SettingsCard is a Card preset — pass layout-only \`className\` (w-*, margins, flex/grid), not spacing/surface/radius utilities. Use \`contentClassName\` for the body or the primitive <Card> for a one-off. ${ESCAPE}`,
  ),
  dsCardClassnameRule(
    'SpaceSettingsSection',
    `SpaceSettingsSection is a Card preset — pass layout-only \`className\`, not spacing/surface/radius utilities. ${ESCAPE}`,
  ),
  dsCardClassnameRule(
    'TxCard',
    `TxCard is a Card preset — pass layout-only \`className\`, not spacing/surface/radius utilities. ${ESCAPE}`,
  ),
  ...INPUT_SLOTS.map((element) =>
    dsInputClassnameRule(
      element,
      `Don't set height/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*, border) on <${element}> — use \`inputSize\` ('sm'|'default'|'lg'|'hero' — match the height of the button on the same row) / \`variant\` ('default'|'surface', plus 'search' on InputGroup). \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Input story; add a variant to ${DS_COMPONENTS}/input.tsx if none fits. ${ESCAPE}`,
    ),
  ),
  dsInputClassnameRule(
    'SearchInput',
    `SearchInput is the shared search preset — pass layout-only \`className\` (w-*, margins), not height/skin utilities. Use \`inputSize\`/\`variant\`, or the primitive <InputGroup> for a one-off. ${ESCAPE}`,
  ),
  dsInputClassnameRule(
    'SearchField',
    `SearchField is a search preset (being retired for <SearchInput>) — pass layout-only \`className\`, not height/skin utilities. ${ESCAPE}`,
  ),
  dsInputClassnameRule(
    'NumberField',
    `NumberField forwards styling to its Input — pass \`inputSize\`/\`variant\`, not height/skin utilities via \`className\`. ${ESCAPE}`,
  ),
  dsInputClassnameRule(
    'NameInput',
    `NameInput forwards styling to its Input — pass \`inputSize\`/\`variant\`, not height/skin utilities via \`className\`. ${ESCAPE}`,
  ),
  ...['TabsList', 'TabsTrigger'].map((element) =>
    dsTabsClassnameRule(
      element,
      `Don't set spacing/surface/radius utilities (gap-*, p-*/px-*/py-*, rounded-*, bg-*, border, shadow-*, text-xs|sm|base|lg) on <${element}> — use the TabsList \`variant\` ('underline'|'toggle', with tone/size). \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Tabs story; add a variant to ${DS_COMPONENTS}/tabs.tsx if none fits. ${ESCAPE}`,
    ),
  ),
  ...['Badge', 'Chip'].map((element) =>
    dsBadgeClassnameRule(
      element,
      `Don't set geometry/colour utilities (h-*, px-*/py-*, text-xs|sm|base|lg, text-[…], rounded-*, bg-*, border) on <${element}> — use the \`variant\`, \`size\` ('sm'|'default'|'lg'|'auto'), and \`shape\` ('pill'|'tag') props. \`className\` is layout-only (w-*, margins, flex/grid). See the UI/${element} story; add a variant to ${DS_COMPONENTS}/${element.toLowerCase()}.tsx if none fits. ${ESCAPE}`,
    ),
  ),
  ...OVERLAY_SLOTS.map((element) =>
    dsDialogClassnameRule(
      element,
      `Don't set width/padding/surface utilities (max-w-*, w-[…], p-*/px-*/py-*, gap-*, rounded-*, bg-*, border, shadow-*) on <${element}> — use the \`size\`, \`padding\`, \`surface\`, and (Header/Footer) \`divided\` props. Layout-only className (max-h-*, w-full, flex/grid, overflow) is fine. See the UI/Dialog|Sheet|Drawer story; add a variant to the primitive if none fits. ${ESCAPE}`,
    ),
  ),
]

/**
 * Drop-in flat-config fragment for consumers that have no other `no-restricted-syntax`
 * entries. Apps that do should spread `designSystemRestrictedSyntax` into their own rule
 * instead — ESLint takes the last definition of a rule, not the union.
 */
const designSystemFlatConfig = {
  name: 'safe/design-system',
  rules: {
    'no-restricted-syntax': ['error', ...designSystemRestrictedSyntax],
  },
}

module.exports = {
  dsButtonClassnameRule,
  dsCardClassnameRule,
  dsInputClassnameRule,
  dsTabsClassnameRule,
  dsBadgeClassnameRule,
  dsDialogClassnameRule,
  designSystemRestrictedSyntax,
  designSystemFlatConfig,
}
