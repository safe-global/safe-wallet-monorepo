import unusedImports from 'eslint-plugin-unused-imports'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

// Design-system button-styling guard: flags size/skin utilities (owned by the
// `size`/`variant` props) set via `className` on a <Button> or a closed button
// preset. Matches the literal even inside cn(...). See .storybook/AGENTS.md.
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

// Design-system Badge/Chip-styling guard. Badge/Chip own geometry (`size`/`shape`) and
// colour (`variant`) — so this flags `h-`, `px-`/`py-`, font sizes (incl. arbitrary
// `text-[10px]`/`text-[var(--…)]`), `rounded-`, `bg-`, and `border`. `w-*`, margins, and
// flex/grid stay layout-only. Matches literals inside cn(...). Escape hatch:
// `// eslint-disable-next-line no-restricted-syntax -- <reason>`.
const dsBadgeClassnameRule = (element, message) => ({
  selector: `JSXOpeningElement[name.name='${element}'] > JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-|px-|py-|text-(xs|sm|base|lg)|text-\\[|rounded-|bg-|border)/]`,
  message,
})

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/.github/',
      '**/cypress/',
      '**/cypress.config.js',
      '**/src/types/contracts/',
      '**/.storybook/test-runner.mjs',
      '**/.storybook/mocks/*.js',
      '**/public/mockServiceWorker.js',
    ],
  },
  ...compat.extends('next', 'prettier', 'plugin:storybook/recommended'),
  {
    plugins: {
      'unused-imports': unusedImports,
      '@typescript-eslint': typescriptEslint,
      'no-only-tests': noOnlyTests,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },

    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/google-font-display': 'off',
      '@next/next/google-font-preconnect': 'off',
      '@next/next/no-page-custom-font': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'no-constant-condition': 'warn',

      'unused-imports/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: 'useAsync',
        },
      ],

      'no-only-tests/no-only-tests': 'error',
      'object-shorthand': ['error', 'properties'],
      'jsx-quotes': ['error', 'prefer-double'],

      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never',
        },
      ],

      // Feature architecture: Prevent importing feature internals from outside the feature
      // This enforces that features expose a clean public API through their index.ts barrel file
      //
      // ALLOWED imports:
      //   @/features/myfeature              - main barrel (components via useLoadFeature, types, lightweight hooks)
      //   @/features/myfeature/store        - Redux store (slice, selectors, actions) - needed at store init
      //   @/features/myfeature/services     - services barrel (lightweight utilities only)
      //
      // FORBIDDEN imports (will cause bundle bloat):
      //   @/features/myfeature/components/* - use useLoadFeature() instead
      //   @/features/myfeature/hooks/*      - export through feature barrel if lightweight
      //   @/features/myfeature/services/*   - heavy services should be in contract, accessed via useLoadFeature()
      //
      // See apps/web/docs/feature-architecture.md for details
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Block deep imports into feature components (defeats lazy loading)
            {
              group: ['@/features/*/components', '@/features/*/components/**'],
              message:
                'Do not import components directly. Use useLoadFeature() to access lazy-loaded components. See docs/feature-architecture.md',
            },
            // Block deep imports into feature hooks (should go through barrel)
            {
              group: ['@/features/*/hooks', '@/features/*/hooks/**'],
              message: 'Import hooks from the feature barrel (@/features/myfeature) not from hooks folder directly.',
            },
            // Block deep imports into services internal files (barrel is OK for lightweight utils)
            {
              group: ['@/features/*/services/*', '!@/features/*/services/index'],
              message:
                'Import from @/features/myfeature/services (barrel) for lightweight utils, or use useLoadFeature() for heavy services.',
            },
            // Block deep imports into store internal files (barrel is OK)
            {
              group: ['@/features/*/store/*', '!@/features/*/store/index'],
              message: 'Import from @/features/myfeature/store (barrel) not from internal store files.',
            },
            // Block internal file imports (handle.ts is internal, only index.ts is public)
            {
              group: ['@/features/*/handle'],
              message: 'Import from feature index file only. The handle is internal - use @/features/{name} instead.',
            },
            // Same patterns for relative imports
            {
              // Same for relative imports
              group: [
                '../features/*/components',
                '../features/*/components/**',
                '../../features/*/components',
                '../../features/*/components/**',
              ],
              message: 'Do not import components directly. Use useLoadFeature() instead.',
            },
          ],
        },
      ],

      // Design-system consistency: on <Button>, `className` is for LAYOUT only
      // (w-full, margins, grid placement). Height/padding/font-size/radius/background
      // are owned by the `size`/`variant` props — overriding them via className is what
      // makes buttons drift out of sync. If no size/variant fits a recurring need, add one
      // to components/ui/button.tsx. See the UI/Button story + .storybook/AGENTS.md
      // ("Component variants over custom styling").
      'no-restricted-syntax': [
        'error',
        dsButtonClassnameRule(
          'Button',
          "Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <Button> — use a `size`/`variant` prop. See the UI/Button story and .storybook/AGENTS.md; add a variant/size to components/ui/button.tsx if none fits. The only sanctioned raw-styling escape is `// eslint-disable-next-line no-restricted-syntax -- <reason>`.",
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
          "Don't set size/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*) on <SelectTrigger> — use `size` ('sm'|'default'|'lg') / `variant` ('default'|'surface'|'ghost'). See the UI/Select story; add a variant to components/ui/select.tsx if none fits. Escape hatch: `// eslint-disable-next-line no-restricted-syntax -- <reason>`.",
        ),
        ...['Card', 'CardHeader', 'CardContent', 'CardFooter', 'CardTitle', 'CardDescription', 'CardAction'].map(
          (element) =>
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
            `Don't set height/skin utilities (h-*, px-*/py-*, text-xs|sm|base|lg, rounded-*, bg-*, border) on <${element}> — use \`inputSize\` ('sm'|'default'|'lg'|'xl') / \`variant\` ('default'|'surface'). \`className\` is layout-only (w-*, margins, flex/grid). See the UI/Input story; add a variant to components/ui/input.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
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
        ...['Badge', 'Chip'].map((element) =>
          dsBadgeClassnameRule(
            element,
            `Don't set geometry/colour utilities (h-*, px-*/py-*, text-xs|sm|base|lg, text-[…], rounded-*, bg-*, border) on <${element}> — use the \`variant\`, \`size\` ('sm'|'default'|'lg'|'auto'), and \`shape\` ('pill'|'tag') props. \`className\` is layout-only (w-*, margins, flex/grid). See the UI/${element} story; add a variant to components/ui/${element.toLowerCase()}.tsx if none fits. Escape hatch: \`// eslint-disable-next-line no-restricted-syntax -- <reason>\`.`,
          ),
        ),
      ],
    },
  },
  // Override for story files: allow type-only imports from @storybook/react
  // since @storybook/nextjs re-exports these types but TypeScript doesn't always resolve them correctly
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
]
