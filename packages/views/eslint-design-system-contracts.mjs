const ESCAPE_HATCH = 'Escape hatch: `// eslint-disable-next-line shadcn/no-restyle -- <reason>`.'

const SIZE_AND_SKIN = ['h-*', 'px-*', 'py-*', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'rounded-*', 'bg-*']
const SPACING_AND_SURFACE = [...SIZE_AND_SKIN, 'p-*', 'pt-*', 'pb-*', 'pl-*', 'pr-*', 'gap-*', 'border*', 'shadow-*']

const names = (elements) => `^(${elements.join('|')})$`

export const designSystemContracts = [
  {
    pattern: names(['Button']),
    deny: SIZE_AND_SKIN,
    message: `<Button> owns its size and skin. Use a \`size\`/\`variant\` prop; \`className\` is layout-only. See the UI/Button story and apps/web/AGENTS.md. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names(['SubmitButton', 'ActionButton']),
    deny: SIZE_AND_SKIN,
    message: `This is a closed button preset and takes no styling className. Use \`fullWidth\` for layout, or the primitive <Button> for a one-off. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names(['SelectTrigger']),
    deny: SIZE_AND_SKIN,
    message: `<SelectTrigger> owns its size and skin. Use \`size\` ('sm'|'default'|'lg') to match the row, or \`variant\` ('default'|'ghost'). See the UI/Select story. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names([
      'Card',
      'CardHeader',
      'CardContent',
      'CardFooter',
      'CardTitle',
      'CardDescription',
      'CardAction',
      'SettingsCard',
      'SpaceSettingsSection',
      'TxCard',
    ]),
    deny: SPACING_AND_SURFACE,
    message: `Card owns spacing, radius and surface. Use the \`size\`, \`variant\` and \`radius\` props; \`className\` is layout-only. See the UI/Card story. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names([
      'Input',
      'InputGroup',
      'InputGroupInput',
      'InputGroupAddon',
      'InputGroupText',
      'InputGroupTextarea',
      'InputGroupButton',
      'SearchInput',
      'SearchField',
      'NumberField',
      'NameInput',
    ]),
    deny: [...SIZE_AND_SKIN, 'border*'],
    message: `Input owns its height and skin. Use \`inputSize\` and \`variant\`; \`className\` is layout-only. See the UI/Input story. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names(['TabsList', 'TabsTrigger']),
    deny: SPACING_AND_SURFACE,
    message: `Tabs own their spacing and surface. Use the TabsList \`variant\` ('underline'|'toggle'); \`className\` is layout-only. See the UI/Tabs story. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names(['Badge', 'Chip']),
    deny: [...SIZE_AND_SKIN, 'text-[*]', 'border*'],
    message: `Badge and Chip own geometry and colour. Use the \`variant\`, \`size\` and \`shape\` props; \`className\` is layout-only. ${ESCAPE_HATCH}`,
  },
  {
    pattern: names([
      'DialogContent',
      'DialogHeader',
      'DialogFooter',
      'SheetContent',
      'SheetHeader',
      'SheetFooter',
      'DrawerContent',
      'DrawerHeader',
      'DrawerFooter',
    ]),
    deny: [
      'p-*',
      'px-*',
      'py-*',
      'pt-*',
      'pb-*',
      'gap-*',
      'max-w-*',
      'w-[*]',
      'rounded-*',
      'bg-*',
      'border*',
      'shadow-*',
    ],
    message: `Dialog, Sheet and Drawer own width, padding and surface. Use the \`size\`, \`padding\`, \`surface\` and \`divided\` props. ${ESCAPE_HATCH}`,
  },
]
