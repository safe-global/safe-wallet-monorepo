// Design-system button-styling guard: flags size/skin utilities (owned by the
// `size`/`variant` props) set via `className` on a <Button> or a closed button
// preset. Matches the literal even inside cn(...). See apps/web/AGENTS.md.
const dsButtonClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-)/]`,
  message,
})

// Design-system Card-styling guard. Card owns spacing (gap/padding), radius, and
// surface (bg/border/shadow) via its `size`/`variant`/`radius` props — so this rule
// flags a wider set than the button rule: `gap-`, full-side `p-`/`pt-`/`pb-`, `border`,
// and `shadow-`. `className` stays layout-only (w-*, margins, flex/grid). Matches the
// literal even inside cn(...). Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsCardClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|p-|px-|py-|pt-|pb-|pl-|pr-|gap-|text-(xs|sm|base|lg)|rounded-|bg-|border|shadow-)/]`,
  message,
})

// Design-system Input-styling guard. Input/InputGroup own height (`inputSize`) and skin
// (`variant`: bg/border) — so this flags `h-`, `px-`/`py-`, `rounded-`, `bg-`, `border`, and
// font sizes on className. `w-*`, margins, and flex/grid stay layout-only. Matches literals
// inside cn(...). Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsInputClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|rounded-|bg-|border)/]`,
  message,
})

// Design-system Tabs-styling guard. TabsList owns bg/padding/height/radius/gap via its
// `variant` (underline/toggle, + tone/size) and TabsTrigger owns its per-variant styling — so
// call sites pass only `variant` + layout-only className (w-*, margins, flex/grid). Same wide
// regex as Card. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsTabsClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|p-|px-|py-|pt-|pb-|pl-|pr-|gap-|text-(xs|sm|base|lg)|rounded-|bg-|border|shadow-)/]`,
  message,
})

// Design-system Badge/Chip-styling guard. Badge/Chip own geometry (`size`/`shape`) and
// colour (`variant`) — so this flags `h-`, `px-`/`py-`, font sizes (incl. arbitrary
// `text-[10px]`/`text-[var(--…)]`), `rounded-`, `bg-`, and `border`. `w-*`, margins, and
// flex/grid stay layout-only. Matches literals inside cn(...). Escape hatch:
// `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsBadgeClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|text-\\[|rounded-|bg-|border)/]`,
  message,
})

// Design-system Dialog/Sheet/Drawer-styling guard. Content owns width (`size`), body
// `padding`, and `surface` (bg/border/shadow); Header/Footer own `divided`. So this flags
// `max-w-`, arbitrary `w-[…]`, `p-`/`px-`/`py-`/`pt-`/`pb-`, `gap-`, `rounded-`, `bg-`,
// `border`, `shadow-`. It deliberately does NOT flag `max-h-`, `w-full`, `w-3/4`, flex/grid
// or overflow — those stay layout-only. Matches literals inside cn(...). Escape hatch:
// `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsDialogClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(p-|px-|py-|pt-|pb-|gap-|max-w-|w-\\[|rounded-|bg-|border|shadow-)/]`,
  message,
})

export const designSystemSyntaxRules = [
  dsButtonClassnameRule(
    'Button',
    "Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <Button> — use a `size`/`variant` prop. See the UI/Button story and apps/web/AGENTS.md; add a variant/size to components/ui/button.tsx if none fits. The only sanctioned raw-styling escape is `// eslint-disable-next-line no-restricted-syntax -- <reason>`.",
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
    'SelectTrigger',
    "Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <SelectTrigger> — use `size` ('sm'|'default'|'lg' — match the height of the button/field on the same row) / `variant` ('default'|'ghost'). See the UI/Select story; add a variant to components/ui/select.tsx if none fits. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.",
  ),
  ...['Card', 'CardHeader', 'CardContent', 'CardFooter', 'CardTitle', 'CardDescription', 'CardAction'].map((element) =>
    dsCardClassnameRule(
      element,
      `Don't set spacing/surface/radius utilities (gap-*, p-*/px-*/py-*, rounded-*, bg-*, border, shadow-*, text-xs|sm|base|lg) on <${element}> — use the \`size\` ('sm'|'default'|'lg'|'none'), \`variant\` ('outlined'|'muted'), and \`radius\` props. \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Card story; add a variant/size to components/ui/card.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
    ),
  ),
  dsCardClassnameRule(
    'SettingsCard',
    'SettingsCard is a Card preset — pass layout-only `className` (w-*, margins, flex/grid), not spacing/surface/radius utilities. Use `contentClassName` for the body or the primitive <Card> for a one-off. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  dsCardClassnameRule(
    'SpaceSettingsSection',
    'SpaceSettingsSection is a Card preset — pass layout-only `className`, not spacing/surface/radius utilities. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  dsCardClassnameRule(
    'TxCard',
    'TxCard is a Card preset — pass layout-only `className`, not spacing/surface/radius utilities. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  ...[
    'Input',
    'InputGroup',
    'InputGroupInput',
    'InputGroupAddon',
    'InputGroupText',
    'InputGroupTextarea',
    'InputGroupButton',
  ].map((element) =>
    dsInputClassnameRule(
      element,
      `Don't set height/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*, border) on <${element}> — use \`inputSize\` ('sm'|'default'|'lg'|'hero', plus 'heroWrap' on InputGroup for a hero-height control whose content wraps — match the height of the button on the same row) / \`variant\` ('default'|'surface', plus 'search'|'outline' on InputGroup). \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Input story; add a variant to components/ui/input.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
    ),
  ),
  dsInputClassnameRule(
    'SearchInput',
    'SearchInput is the shared search preset — pass layout-only `className` (w-*, margins), not height/skin utilities. Use `inputSize`/`variant`, or the primitive <InputGroup> for a one-off. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  dsInputClassnameRule(
    'SearchField',
    'SearchField is a search preset (being retired for <SearchInput>) — pass layout-only `className`, not height/skin utilities. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  dsInputClassnameRule(
    'NumberField',
    'NumberField forwards styling to its Input — pass `inputSize`/`variant`, not height/skin utilities via `className`. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  dsInputClassnameRule(
    'NameInput',
    'NameInput forwards styling to its Input — pass `inputSize`/`variant`, not height/skin utilities via `className`. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
  ),
  ...['TabsList', 'TabsTrigger'].map((element) =>
    dsTabsClassnameRule(
      element,
      `Don't set spacing/surface/radius utilities (gap-*, p-*/px-*/py-*, rounded-*, bg-*, border, shadow-*, text-xs|sm|base|lg) on <${element}> — use the TabsList \`variant\` ('underline'|'toggle', with tone/size). \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Tabs story; add a variant to components/ui/tabs.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
    ),
  ),
  ...['Badge', 'Chip'].map((element) =>
    dsBadgeClassnameRule(
      element,
      `Don't set geometry/colour utilities (h-*, px-*/py-*, text-xs|sm|base|lg, text-[…], rounded-*, bg-*, border) on <${element}> — use the \`variant\`, \`size\` ('sm'|'default'|'lg'|'auto'), and \`shape\` ('pill'|'tag') props. \`className\` is layout-only (w-*, margins, flex/grid). See the UI/${element} story; add a variant to components/ui/${element.toLowerCase()}.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
    ),
  ),
  ...[
    'DialogContent',
    'DialogHeader',
    'DialogFooter',
    'SheetContent',
    'SheetHeader',
    'SheetFooter',
    'DrawerContent',
    'DrawerHeader',
    'DrawerFooter',
  ].map((element) =>
    dsDialogClassnameRule(
      element,
      `Don't set width/padding/surface utilities (max-w-*, w-[…], p-*/px-*/py-*, gap-*, rounded-*, bg-*, border, shadow-*) on <${element}> — use the \`size\`, \`padding\`, \`surface\`, and (Header/Footer) \`divided\` props. Layout-only className (max-h-*, w-full, flex/grid, overflow) is fine. See the UI/Dialog|Sheet|Drawer story; add a variant to the primitive if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
    ),
  ),
]
